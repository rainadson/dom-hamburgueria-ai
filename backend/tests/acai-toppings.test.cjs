const assert=require('node:assert/strict');
const {test}=require('node:test');
process.env.SUPABASE_URL='https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY='test-only';
process.env.GROQ_API_KEY='test-only';
const {OrderService}=require('../dist/orders/order.service');
const {ConversationService}=require('../dist/conversation/conversation.service');
const {validateToppings}=require('../dist/products/acai-toppings');
const {buildConversationContext}=require('../dist/conversation/conversation.context');
function orders(){const s=new OrderService();s.products={findByName:async(name)=>({id:1,name,price:name==='Açaí 350 ml'?8.99:4.49})};return s;}
test('two included toppings survive recalculation and repository persistence at unchanged price',async()=>{
 const s=orders();let order=await s.calculate([{product:'Açaí 350 ml',quantity:2,toppings:['nutella','banana']}]);
 order=await s.calculate(order.items);assert.equal(order.total,17.98);
 let saved;s.repository={createOrder:async data=>{saved=data;return data}};
 await s.saveOrder('test',order);
 assert.deepEqual(saved.items[0].toppings,['Nutella','Banana']);
 assert.deepEqual(saved.items[0].components,['Toppings: Nutella + Banana']);
 assert.equal(saved.items.length,1);
});
test('separate acai choices remain separate',async()=>{
 const order=await orders().calculate([{product:'Açaí M 200 ml',quantity:1,toppings:['paçoca']},{product:'Açaí M 200 ml',quantity:1,toppings:['leite em po','granola']}]);
 assert.equal(order.total,8.98);assert.deepEqual(order.items[0].toppings,['Paçoca']);assert.deepEqual(order.items[1].toppings,['Leite em pó','Granola']);
});
test('explicitly no toppings is distinct from missing legacy data',async()=>{
 const s=orders();const result=await s.calculate([{product:'Açaí 350 ml',quantity:1,toppings:[]},{product:'Açaí 350 ml',quantity:1}]);
 assert.deepEqual(result.items[0].components,['Sem toppings']);assert.equal(result.items[1].toppings,undefined);
});
for(const value of [['Nutella','Banana','Granola'],['Chocolate'],['Nutella','nutella'],'Banana',null]){
 test(`invalid choice ${JSON.stringify(value)} cannot be priced or saved`,async()=>{
  const s=orders();s.repository={createOrder:async()=>assert.fail('must not persist')};
  const item={product:'Açaí 350 ml',quantity:1,toppings:value};
  await assert.rejects(s.calculate([item]));await assert.rejects(s.saveOrder('test',{items:[item]}));
 });
}
test('açaí ordered over two turns is added once and toppings reach confirmation',async()=>{
 const c={id:1,state:'WAITING_ORDER',history:[],order_draft:{items:[]}};
 const s=new ConversationService();s.orderService=orders();
 s.repository={findByPhone:async()=>structuredClone(c),updateDraft:async(_,d)=>{c.order_draft=d},updateState:async(_,state)=>{c.state=state},updateHistory:async(_,h)=>{c.history=h}};
 s.aiService={generateResponse:async(message,history)=>message==='um açaí 350 ml'?{intent:'QUESTION',items:[],reply:'Quais toppings deseja?'}:{intent:'ORDER',items:[{product:'Açaí 350 ml',quantity:1,toppings:['Nutella','Banana']}],reply:'Perfeito!'}};
 await s.processMessage('test','um açaí 350 ml');assert.equal(c.order_draft.items.length,0);
 await s.processMessage('test','Nutella e banana');const result=await s.processMessage('test','é tudo');
 assert.equal(c.order_draft.items.length,1);assert.equal(c.order_draft.total,8.99);assert.match(result.ai.reply,/Toppings: Nutella \+ Banana/);
 const context=buildConversationContext(c,c.history);assert.match(context,/"toppings":\["Nutella","Banana"\]/);
});
