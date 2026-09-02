const assert=require('node:assert/strict');
const {test}=require('node:test');
process.env.SUPABASE_URL='https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY='test-only';
process.env.GROQ_API_KEY='test-only';
const {ConversationService}=require('../dist/conversation/conversation.service');
function flow(state='CONFIRMATION',step){
 const row={id:1,state,history:[],order_draft:{items:[{product:'Dom Tradicional',quantity:1,price:8.99,subtotal:8.99}],total:8.99,...(step?{checkout_step:step}:{})}};
 const saved=[];const service=new ConversationService();
 service.repository={findByPhone:async()=>structuredClone(row),updateDraft:async(_,d)=>row.order_draft=structuredClone(d),updateState:async(_,s)=>row.state=s,updateHistory:async(_,h)=>row.history=structuredClone(h)};
 service.aiService={generateResponse:async()=>{throw Error('Checkout must not invoke AI')}};
 service.orderService={saveOrder:async(_,d)=>{saved.push(structuredClone(d));return {id:99}}};
 async function send(message,state,step){const response=await service.processMessage('fictional',message);assert.equal(row.state,state);assert.equal(row.order_draft.checkout_step,step);assert.equal(row.history.at(-2).content,message);assert.equal(row.history.at(-1).content,response.ai.reply);return response;}
 return {row,saved,service,send};
}
for(const [state,step] of [['WAITING_ORDER','NAME'],['DELIVERY_TYPE','DELIVERY_TYPE'],['ADDRESS','ADDRESS'],['PAYMENT','PAYMENT'],['CASH_AMOUNT','CASH_AMOUNT'],['CONFIRMATION','FINAL_REVIEW'],['MENU_DRINK',undefined]]){
 test(`cancel draft during ${state}/${step} without creating order`,async()=>{
  const f=flow(state,step);if(state==='MENU_DRINK')f.row.order_draft.items=[{product:'Menu Dom Tradicional',quantity:1}];
  await f.send('Cancelar!','CANCELLED');assert.deepEqual(f.row.order_draft,{});assert.equal(f.saved.length,0);
 });
}
for(const step of [undefined,'FINAL_REVIEW'])test(`negative confirmation preserves draft (${step})`,async()=>{
 const f=flow('CONFIRMATION',step);const before=structuredClone(f.row.order_draft);
 await f.send('Não, obrigado!','CONFIRMATION',step);assert.deepEqual(f.row.order_draft,before);assert.equal(f.saved.length,0);
});
test('delivery and cash: state, checkout, change, history and only final confirmation saves',async()=>{
 const f=flow();await f.send('Sim!','WAITING_ORDER','NAME');
 await f.send('Cliente Fictício','DELIVERY_TYPE','DELIVERY_TYPE');
 await f.send('entrega','ADDRESS','ADDRESS');await f.send('Morada fictícia de teste','PAYMENT','PAYMENT');
 await f.send('dinheiro','CASH_AMOUNT','CASH_AMOUNT');
 for(const invalid of ['não','abc','0','5'])await f.send(invalid,'CASH_AMOUNT','CASH_AMOUNT');
 await f.send('20,00','CONFIRMATION','FINAL_REVIEW');assert.equal(f.row.order_draft.change,11.01);assert.equal(f.saved.length,0);
 await f.send('é tudo','CONFIRMATION','FINAL_REVIEW');assert.equal(f.saved.length,0);
 await f.send('Sim, pode confirmar!','FINISHED');assert.equal(f.saved.length,1);assert.equal(f.saved[0].address,'Morada fictícia de teste');assert.deepEqual(f.row.order_draft,{});assert.equal(f.row.history.length,24);
});
test('pickup and card skip address and cash and save only at final review',async()=>{
 const f=flow();await f.send('sim','WAITING_ORDER','NAME');await f.send('Cliente Teste','DELIVERY_TYPE','DELIVERY_TYPE');
 await f.send('não','DELIVERY_TYPE','DELIVERY_TYPE');await f.send('levantamento','PAYMENT','PAYMENT');
 await f.send('não','PAYMENT','PAYMENT');await f.send('multibanco','CONFIRMATION','FINAL_REVIEW');
 assert.equal(f.row.order_draft.address,null);assert.equal(f.saved.length,0);
 await f.send('confirmo!','FINISHED');assert.equal(f.saved.length,1);assert.equal(f.saved[0].payment_method,'MULTIBANCO');
});
