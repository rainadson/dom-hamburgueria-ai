const {test}=require('node:test');const assert=require('node:assert/strict');
process.env.SUPABASE_URL='https://example.supabase.co';process.env.SUPABASE_SERVICE_ROLE_KEY='test';process.env.GROQ_API_KEY='test';
const {ProductRepository}=require('../dist/products/product.repository');const {ConversationService}=require('../dist/conversation/conversation.service');
const products=require('../dist/products/product.routes').default;const chat=require('../dist/routes/ai.routes').default;
test('basic isolated load serves parallel reads and rejects invalid chat without side effects',async()=>{
 const originals={find:ProductRepository.prototype.findAllAdmin,chat:ConversationService.prototype.processMessage};let reads=0,chats=0;
 ProductRepository.prototype.findAllAdmin=async()=>{reads++;return [{id:1,name:'Fictício',price:1,active:true}];};ConversationService.prototype.processMessage=async()=>{chats++;return {};};
 const express=require('express');const app=express();app.use(express.json());app.use('/products',products);app.use(chat);const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const base=`http://127.0.0.1:${server.address().port}`;
 try{
  const requests=[...Array.from({length:200},()=>()=>fetch(base+'/products')),...Array.from({length:200},()=>()=>fetch(base+'/chat',{method:'POST',headers:{'content-type':'application/json'},body:'{}'}))];
  const responses=[];for(let index=0;index<requests.length;index+=20)responses.push(...await Promise.all(requests.slice(index,index+20).map(run=>run())));
  assert.deepEqual(responses.slice(0,200).map(r=>r.status),Array(200).fill(200));assert.deepEqual(responses.slice(200).map(r=>r.status),Array(200).fill(400));assert.equal(reads,200);assert.equal(chats,0);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));ProductRepository.prototype.findAllAdmin=originals.find;ConversationService.prototype.processMessage=originals.chat;}
});
