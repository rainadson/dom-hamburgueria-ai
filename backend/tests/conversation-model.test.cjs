const assert = require('node:assert/strict');
const { test } = require('node:test');
const { buildSystemPrompt } = require('../dist/prompts/system.prompt');
const { buildConversationContext } = require('../dist/conversation/conversation.context');

// Opt-in: uses the configured model with fictional messages and a fixed menu.
// Does not import repositories, read customer data or persist orders.
const enabled = process.env.RUN_AI_LIVE_TESTS === '1';
let client;
if (enabled) {
  require('dotenv').config({ path: require('node:path').join(__dirname, '../.env'), quiet: true });
  const Groq = require('groq-sdk');
  client = new Groq({ apiKey: process.env.GROQ_API_KEY, timeout: 30000, maxRetries: 0 });
}
const menu = '• X Salada (€5.00) - Hambúrguer\n• Guaraná (€2.00) - Refrigerante\n• Batata (€2.00) - Porção\n• Coca-Cola (€2.00) - Refrigerante';
const cases = [
  { name: 'specific offer', question: 'Quer adicionar um Guaraná?', answer: 'pode ser', expected: [{ product: 'Guaraná', quantity: 1 }] },
  { name: 'quantity confirmation', question: 'Pode ser 2 unidades de Guaraná?', answer: 'pode ser', expected: [{ product: 'Guaraná', quantity: 2 }] },
  { name: 'generic question', question: 'Deseja acrescentar mais alguma coisa?', answer: 'pode ser', expected: [] },
  { name: 'multiple choices', question: 'Quer Guaraná ou Coca-Cola?', answer: 'esse mesmo', expected: [] },
  { name: 'refusal', question: 'Quer adicionar batata?', answer: 'não', expected: [] },
  { name: 'finished adding', question: 'Quer adicionar batata?', answer: 'é tudo', expected: [] },
  { name: 'no history', question: null, answer: 'pode ser', expected: [] },
  { name: 'checkout question', question: 'Seu endereço é Rua X?', answer: 'pode ser', state: 'ADDRESS', expected: [] },
];
for (const c of cases) {
  test(`live model: ${c.name}`, { skip: !enabled }, async () => {
    // Space requests to respect the configured model's tokens-per-minute limit.
    await require('node:timers/promises').setTimeout(22000);
    const history = c.question ? [
      { role: 'user', content: 'Quero um X Salada' },
      { role: 'assistant', content: c.question },
    ] : [];
    const context = { state: c.state || 'UPSELL', order_draft: {
      items: [{ product: 'X Salada', quantity: 1 }], checkout_step: c.state === 'ADDRESS' ? 'ADDRESS' : undefined,
    } };
    const completion = await client.chat.completions.create({
      model: 'openai/gpt-oss-120b', temperature: 0,
      messages: [{ role: 'system', content: buildSystemPrompt(menu) + buildConversationContext(context, history) },
        ...history, { role: 'user', content: c.answer }],
    });
    const result = JSON.parse(completion.choices[0].message.content || '{}');
    assert.deepEqual((result.items || []).map(({ product, quantity }) => ({ product, quantity })), c.expected);
    if (c.expected.length) assert.equal(result.intent, 'ORDER');
    else assert.ok(!['ORDER', 'MENU_ACCEPTED', 'MENU_OFFER'].includes(result.intent));
    assert.ok(result.reply?.length);
  });
}
