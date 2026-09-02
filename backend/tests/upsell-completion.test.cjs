const assert = require('node:assert/strict');
const { test } = require('node:test');
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-only';
process.env.GROQ_API_KEY = 'test-only';
const { ConversationService } = require('../dist/conversation/conversation.service');
const { ConversationState: State } = require('../dist/conversation/conversation.types');

function setup(state, checkout_step) {
  const items = [{ product: 'X Salada', quantity: 1, subtotal: 5 }, { product: 'Batata', quantity: 1, subtotal: 2 }];
  const conversation = { id: 1, state, history: [], order_draft: { items, total: 7, checkout_step } };
  const service = new ConversationService();
  service.repository = {
    findByPhone: async () => structuredClone(conversation),
    updateDraft: async (_, draft) => { conversation.order_draft = draft; },
    updateState: async (_, state) => { conversation.state = state; },
    updateHistory: async (_, history) => { conversation.history = history; },
  };
  service.aiService = { generateResponse: async () => { throw new Error('Unexpected model call'); } };
  service.orderService = {
    calculate: async (received) => { assert.deepEqual(received, items); return { items: received, total: 7 }; },
    saveOrder: async () => { throw new Error('Must not submit an order'); },
  };
  return { service, conversation, items };
}

for (const state of [State.UPSELL, State.MENU_OFFER]) {
  for (const answer of ['É tudo!', 'só isso', 'deixa assim', 'pode fechar o pedido']) {
    test(`${state}: ${answer} ends additions without adding or submitting items`, async () => {
      const f = setup(state);
      const result = await f.service.processMessage('test', answer);
      assert.equal(f.conversation.state, State.CONFIRMATION);
      assert.deepEqual(f.conversation.order_draft.items, f.items);
      assert.equal(result.ai.intent, 'CONFIRMATION');
      assert.match(result.ai.reply, /Deseja confirmar o pedido/);
      assert.equal(f.conversation.history.at(-1).content, result.ai.reply);
      await f.service.processMessage('test', 'sim');
      assert.equal(f.conversation.state, State.WAITING_ORDER);
      assert.equal(f.conversation.order_draft.checkout_step, 'NAME');
    });
  }
}

test('declining only the menu still asks about other additions', async () => {
  const f = setup(State.MENU_OFFER);
  const result = await f.service.processMessage('test', 'não quero menu');
  assert.equal(f.conversation.state, State.UPSELL);
  assert.equal(result.ai.intent, 'UPSELL');
});

test('end phrase cannot confirm final checkout', async () => {
  const f = setup(State.CONFIRMATION, 'FINAL_REVIEW');
  await f.service.processMessage('test', 'é tudo');
  assert.equal(f.conversation.state, State.CONFIRMATION);
  assert.equal(f.conversation.order_draft.checkout_step, 'FINAL_REVIEW');
});

test('a product request containing an end phrase is not swallowed', async () => {
  const f = setup(State.UPSELL);
  let interpreted = false;
  f.service.aiService = { generateResponse: async (message) => {
    assert.equal(message, 'uma Coca-Cola e só isso');
    interpreted = true;
    return { intent: 'QUESTION', items: [], reply: 'Qual tamanho?' };
  } };
  await f.service.processMessage('test', 'uma Coca-Cola e só isso');
  assert.equal(interpreted, true);
  assert.equal(f.conversation.state, State.UPSELL);
});
