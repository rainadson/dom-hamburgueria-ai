"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const conversation_types_1 = require("../dist/conversation/conversation.types");
const conversation_context_1 = require("../dist/conversation/conversation.context");
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-only';
process.env.GROQ_API_KEY = 'test-only';
// No calls to a real database, model or order endpoint are allowed in these tests.
const { ConversationService } = require('../dist/conversation/conversation.service');
function setup(state, lastQuestion, modelResult, checkout_step) {
    const conversation = { id: 1, state, history: [{ role: 'assistant', content: lastQuestion }],
        order_draft: { items: [{ product: 'X Salada', quantity: 1, subtotal: 5 }], total: 5, checkout_step } };
    const service = new ConversationService();
    const calls = [];
    service.repository = {
        findByPhone: async () => structuredClone(conversation),
        updateDraft: async (_, draft) => { conversation.order_draft = draft; },
        updateState: async (_, next) => { conversation.state = next; },
        updateHistory: async (_, history) => { conversation.history = history; },
    };
    service.aiService = { generateResponse: async (...args) => { calls.push(args); return modelResult; } };
    service.orderService = {
        calculate: async (items) => ({ items, total: 5 }),
        upgradeMenus: async (_, upgrades) => upgrades.every(item => item.product.startsWith('Menu ')) ? {items: upgrades, total: 12.49} : null,
        saveOrder: async () => { throw new Error('Unexpected order submission'); },
    };
    return { service, conversation, calls };
}
(0, node_test_1.test)('accepted specific offer adds only model-resolved product and passes current context', async () => {
    const f = setup(conversation_types_1.ConversationState.UPSELL, 'Quer adicionar um Guaraná?', { intent: 'ORDER', items: [{ product: 'Guaraná', quantity: 1 }] });
    await f.service.processMessage('test', 'pode ser');
    strict_1.default.deepEqual(f.conversation.order_draft.items.map((i) => i.product), ['X Salada', 'Guaraná']);
    strict_1.default.equal(f.calls[0][0], 'pode ser');
    strict_1.default.equal(f.calls[0][2].state, conversation_types_1.ConversationState.UPSELL);
    strict_1.default.equal(f.calls[0][1][0].content, 'Quer adicionar um Guaraná?');
});
for (const answer of ['não', 'Não, obrigado!', 'não precisa', 'deixa', 'deixa assim', 'é tudo', 'só isso.']) {
    (0, node_test_1.test)(`upsell refusal ${answer} preserves items and advances without model`, async () => {
        const f = setup(conversation_types_1.ConversationState.UPSELL, 'Quer adicionar batata?', { intent: 'ORDER', items: [{ product: 'Batata', quantity: 1 }] });
        await f.service.processMessage('test', answer);
        strict_1.default.equal(f.calls.length, 0);
        strict_1.default.equal(f.conversation.state, conversation_types_1.ConversationState.CONFIRMATION);
        strict_1.default.equal(f.conversation.order_draft.items.length, 1);
    });
}
(0, node_test_1.test)('specific follow-up offer is preserved in response and history', async () => {
    const f = setup(conversation_types_1.ConversationState.WAITING_ORDER, 'O que deseja?', { intent: 'ORDER', items: [], reply: 'Quer adicionar um Guaraná?' });
    const result = await f.service.processMessage('test', 'um X Salada');
    strict_1.default.equal(result.ai.reply, 'Quer adicionar um Guaraná?');
    strict_1.default.equal(f.conversation.history.at(-1)?.content, result.ai.reply);
});
(0, node_test_1.test)('ambiguous acceptance keeps draft unchanged when model asks for clarification', async () => {
    const f = setup(conversation_types_1.ConversationState.UPSELL, 'Deseja mais alguma coisa?', { intent: 'QUESTION', items: [], reply: 'Qual produto?' });
    await f.service.processMessage('test', 'pode ser');
    strict_1.default.equal(f.conversation.order_draft.items.length, 1);
    strict_1.default.equal(f.conversation.state, conversation_types_1.ConversationState.UPSELL);
});
for (const answer of ['Beleza!', 'esse mesmo', 'manda', 'coloca', 'adiciona']) {
    (0, node_test_1.test)(`menu acceptance ${answer} keeps existing menu flow`, async () => {
        const f = setup(conversation_types_1.ConversationState.MENU_OFFER, 'Quer transformar em Menu?', { intent: 'MENU_ACCEPTED', items: [{ product: 'Menu Dom Tradicional', quantity: 1 }] });
        await f.service.processMessage('test', answer);
        strict_1.default.equal(f.conversation.state, conversation_types_1.ConversationState.MENU_DRINK);
        strict_1.default.equal(f.conversation.order_draft.items.length, 1);
    });
}
(0, node_test_1.test)('é tudo ends menu offer without adding accompaniments', async () => {
    const f = setup(conversation_types_1.ConversationState.MENU_OFFER, 'Quer transformar em Menu?', {});
    await f.service.processMessage('test', 'É tudo!');
    strict_1.default.equal(f.calls.length, 0);
    strict_1.default.equal(f.conversation.state, conversation_types_1.ConversationState.CONFIRMATION);
});
(0, node_test_1.test)('payment short reply cannot accept an old offer', async () => {
    const f = setup(conversation_types_1.ConversationState.PAYMENT, 'Dinheiro ou Multibanco?', {}, 'PAYMENT');
    await f.service.processMessage('test', 'pode ser');
    strict_1.default.equal(f.calls.length, 0);
    strict_1.default.equal(f.conversation.state, conversation_types_1.ConversationState.PAYMENT);
});
(0, node_test_1.test)('context distinguishes current checkout question from older product offer', () => {
    const context = (0, conversation_context_1.buildConversationContext)({ state: conversation_types_1.ConversationState.ADDRESS, order_draft: { checkout_step: 'ADDRESS' } }, [
        { role: 'assistant', content: 'Quer Guaraná?' },
        { role: 'user', content: 'não' },
        { role: 'assistant', content: 'Seu endereço é Rua X?' },
    ]);
    const data = JSON.parse(context.split('\n').find(line => line.startsWith('{')));
    strict_1.default.equal(data.last_assistant_message, 'Seu endereço é Rua X?');
    strict_1.default.equal(data.checkout_step, 'ADDRESS');
});
(0, node_test_1.test)('ambiguous or failed menu interpretation does not advance or change draft', async () => {
    for (const result of [{ intent: 'QUESTION', items: [], reply: 'Qual opção?' }, { intent: 'ERROR', items: [] }]) {
        const f = setup(conversation_types_1.ConversationState.MENU_OFFER, 'Qual opção você prefere?', result);
        await f.service.processMessage('test', 'pode ser');
        strict_1.default.equal(f.conversation.state, conversation_types_1.ConversationState.MENU_OFFER);
        strict_1.default.equal(f.conversation.order_draft.items.length, 1);
    }
});
