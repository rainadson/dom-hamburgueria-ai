const assert = require('node:assert/strict');
const { test } = require('node:test');
process.env.SUPABASE_URL='https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY='test-only';
process.env.GROQ_API_KEY='test-only';
const {OrderService}=require('../dist/orders/order.service');
const {ConversationService}=require('../dist/conversation/conversation.service');
const {menuBurgers,menuBase}=require('../dist/products/menu-combos');
const catalog=menuBurgers.flatMap((name,i)=>[
 {id:i*2,name,price:name==='Dom X-tudo Brasil'?12.99:name==='Dom Tradicional'||name==='Dom Chicken Bacon'?8.99:9.99},
 {id:i*2+1,name:`Menu ${name}`,price:name==='Dom X-tudo Brasil'?16.49:name==='Dom Tradicional'||name==='Dom Chicken Bacon'?12.49:13.49}
]).concat([{id:100,name:'Batata frita',price:3.99},{id:101,name:'Coca-Cola (lata)',price:2.5},{id:102,name:'Coca-Cola Zero (lata)',price:2.5}]);
function calculator(){const service=new OrderService();service.products={findByName:async name=>catalog.find(p=>p.name===name)};return service;}
function flow(state,items,result){
 const conversation={id:1,state,history:[{role:'assistant',content:'Quer transformar em Menu?'}],order_draft:{items}};
 const service=new ConversationService();service.orderService=calculator();
 service.orderService.saveOrder=async()=>{throw Error('Unexpected order submission')};
 service.repository={findByPhone:async()=>structuredClone(conversation),updateDraft:async(_,draft)=>{conversation.order_draft=draft},updateState:async(_,s)=>{conversation.state=s},updateHistory:async(_,h)=>{conversation.history=h}};
 service.aiService={generateResponse:async()=>result};
 return {service,conversation};
}
for(const name of menuBurgers){
 test(`${name}: upgrade replaces burger and charges only the fixed menu price`,async()=>{
  const service=calculator();const result=await service.upgradeMenus([{product:name,quantity:1}],[{product:`Menu ${name}`,quantity:1,drink:'Coca-Cola Zero (lata)'}]);
  assert.equal(result.items.length,1);assert.equal(result.total,catalog.find(p=>p.name===`Menu ${name}`).price);
  assert.deepEqual(result.items[0].components,[name,'Batata frita','Coca-Cola Zero (lata)']);
 });
}
test('partial upgrade preserves remaining burger and separately ordered fries',async()=>{
 const result=await calculator().upgradeMenus([{product:'Dom Tradicional',quantity:2},{product:'Batata frita',quantity:1}],[{product:'Menu Dom Tradicional',quantity:1}]);
 assert.equal(result.total,25.47);assert.equal(result.items.length,3);assert.equal(result.items[0].quantity,1);
});
test('upgrade cannot remove more burgers than exist',async()=>{
 assert.equal(await calculator().upgradeMenus([{product:'Dom Tradicional',quantity:1}],[{product:'Menu Dom Tradicional',quantity:2}]),null);
});
test('menu is stable across repeated calculations without duplicate charges',async()=>{
 const service=calculator();let result=await service.calculate([{product:'Menu Dom Tradicional',quantity:3,drink:'Coca-Cola (lata)'}]);
 result=await service.calculate(result.items);assert.equal(result.total,37.47);assert.equal(result.items.length,1);
});
test('unavailable product, invalid quantity and unapproved drink are rejected',async()=>{
 for(const item of [{product:'missing',quantity:1},{product:'Menu Dom Tradicional',quantity:-1},{product:'Menu Dom Tradicional',quantity:1,drink:'Coca-Cola 1 L'}]){
  await assert.rejects(calculator().calculate([item]));
 }
});
test('family combo is not eligible for hamburger menu upgrade',()=>assert.equal(menuBase('Combo família'),undefined));
test('short acceptance creates pending menu, never adds fries as separately priced item',async()=>{
 const f=flow('MENU_OFFER',[{product:'Dom Tradicional',quantity:1}],{intent:'MENU_ACCEPTED',items:[{product:'Menu Dom Tradicional',quantity:1}]});
 await f.service.processMessage('test','pode ser');
 assert.equal(f.conversation.state,'MENU_DRINK');assert.equal(f.conversation.order_draft.total,12.49);
 assert.equal(f.conversation.order_draft.items.length,1);
});
test('new menu order also requires a drink',async()=>{
 const f=flow('WAITING_ORDER',[],{intent:'ORDER',items:[{product:'Menu Dom Tradicional',quantity:1}],reply:'Perfeito!'});
 await f.service.processMessage('test','um Menu Dom Tradicional');assert.equal(f.conversation.state,'MENU_DRINK');
});
test('é tudo cannot finish menu or invent a drink even if model suggests one',async()=>{
 const f=flow('MENU_DRINK',[{product:'Menu Dom Tradicional',quantity:1}],{intent:'ORDER',items:[{product:'Coca-Cola (lata)',quantity:1}]});
 const result=await f.service.processMessage('test','é tudo');assert.equal(f.conversation.state,'MENU_DRINK');
 assert.equal(f.conversation.order_draft.items[0].drink,undefined);assert.match(result.ai.reply,/normal ou Zero/);
});
test('Zero completes menu at fixed price and proceeds to summary',async()=>{
 const f=flow('MENU_DRINK',[{product:'Menu Dom Tradicional',quantity:1}],{intent:'ORDER',items:[{product:'Coca-Cola Zero (lata)',quantity:1}]});
 const result=await f.service.processMessage('test','Zero');assert.equal(f.conversation.state,'CONFIRMATION');
 assert.equal(f.conversation.order_draft.total,12.49);assert.match(result.ai.reply,/Coca-Cola Zero/);
});
test('multiple menu groups require a drink for each group',async()=>{
 const f=flow('MENU_DRINK',[{product:'Menu Dom Tradicional',quantity:1},{product:'Menu Dom Coalho',quantity:1}],{intent:'ORDER',items:[{product:'Coca-Cola (lata)',quantity:1}]});
 await f.service.processMessage('test','normal');assert.equal(f.conversation.state,'MENU_DRINK');
 assert.equal(f.conversation.order_draft.items[1].drink,null);
});
test('saving an incomplete menu is blocked even outside conversation flow',async()=>{
 const service=calculator();service.repository={createOrder:async()=>{throw Error('Repository must not be called')}};
 await assert.rejects(service.saveOrder('test',{items:[{product:'Menu Dom Tradicional',quantity:1}]}),/Escolha o refrigerante/);
});

for (const name of menuBurgers) {
 test(`${name}: offers available menu even when model forgets`,async()=>{
  const f=flow('WAITING_ORDER',[],{intent:'ORDER',items:[{product:name,quantity:2}],reply:'Deseja mais alguma coisa?'});
  const result=await f.service.processMessage('test',`dois ${name}`);
  assert.equal(f.conversation.state,'MENU_OFFER');
  assert.match(result.ai.reply,/3,50 por unidade/);assert.match(result.ai.reply,/normal ou Zero/);
  assert.equal(f.conversation.order_draft.items.length,1);
  assert.equal(f.conversation.order_draft.total,catalog.find(p=>p.name===name).price*2);
 });
}
test('explicit menu refusal overrides even model offer',async()=>{
 const f=flow('WAITING_ORDER',[],{intent:'MENU_OFFER',items:[{product:'Dom Tradicional',quantity:1}],reply:'Quer menu?'});
 const result=await f.service.processMessage('test','um Dom Tradicional sem menu');
 assert.equal(f.conversation.state,'UPSELL');assert.doesNotMatch(result.ai.reply,/menu/i);
});
test('unavailable menu is not offered even if model suggests it',async()=>{
 const f=flow('WAITING_ORDER',[],{intent:'MENU_OFFER',items:[{product:'Dom Tradicional',quantity:1}],reply:'Quer menu?'});
 f.service.orderService.products={findByName:async name=>catalog.find(p=>p.name===name&&!name.startsWith('Menu '))};
 const result=await f.service.processMessage('test','um Dom Tradicional');
 assert.equal(f.conversation.state,'UPSELL');assert.doesNotMatch(result.ai.reply,/menu/i);
});
test('adding a drink after refusing does not reoffer an existing burger',async()=>{
 const f=flow('UPSELL',[{product:'Dom Tradicional',quantity:1}],{intent:'ORDER',items:[{product:'Coca-Cola (lata)',quantity:1}]});
 await f.service.processMessage('test','uma coca');assert.equal(f.conversation.state,'UPSELL');
});
test('multiple burgers offer only available counterparts with catalog prices',async()=>{
 const service=calculator();
 service.products={findByName:async name=>name==='Menu Dom Tradicional'?{name,price:13.99}:null};
 const offer=await service.menuOffer([{product:'Dom Tradicional',price:8.99},{product:'Dom Coalho',price:9.99}]);
 assert.match(offer,/5,00 por unidade/);assert.match(offer,/13,99/);assert.doesNotMatch(offer,/Coalho/);
 assert.equal(await service.menuOffer([{product:'Combo família',price:35.99},{product:'Menu Dom Tradicional',price:12.49}]),null);
});
