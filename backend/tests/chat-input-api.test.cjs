const {test}=require('node:test');const assert=require('node:assert/strict');
process.env.SUPABASE_URL='https://example.supabase.co';process.env.SUPABASE_SERVICE_ROLE_KEY='test';process.env.GROQ_API_KEY='test';
const {ConversationService}=require('../dist/conversation/conversation.service');
const chat=require('../dist/routes/ai.routes').default;const webhook=require('../dist/whatsapp/webhook.routes').default;
test('malformed chat and legacy webhook input never reaches conversation services',async()=>{
 const originals={process:ConversationService.prototype.processMessage,get:ConversationService.prototype.getOrCreate};let calls=0,fail=false;
 ConversationService.prototype.processMessage=async(phone,message)=>{calls++;if(fail)throw Error('PRIVATE_PROVIDER_DETAIL');return {phone,message};};
 ConversationService.prototype.getOrCreate=async phone=>{calls++;return {phone};};
 const express=require('express');const app=express();app.use(express.json());app.use(chat);app.use(webhook);
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
 const base=`http://127.0.0.1:${server.address().port}`;const send=(path,body)=>fetch(base+path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
 try{
  for(const path of ['/chat','/webhook'])for(const body of [{},[],{phone:{},message:'ola'},{phone:123,message:'ola'},{phone:' ',message:'ola'},{phone:'1'.repeat(21),message:'ola'},{phone:'351999999999',message:[]},{phone:'351999999999',message:' '},{phone:'351999999999',message:'x'.repeat(4001)}])assert.equal((await send(path,body)).status,400);
  assert.equal(calls,0);
  const valid={phone:'351999999999',message:'  Olá! 🍔  '};const response=await send('/chat',valid);assert.equal(response.status,200);assert.deepEqual(await response.json(),valid);
  assert.equal((await send('/webhook',valid)).status,200);assert.equal(calls,2);
  fail=true;const failed=await send('/chat',valid);assert.equal(failed.status,500);assert.doesNotMatch(await failed.text(),/PRIVATE_PROVIDER_DETAIL/);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));ConversationService.prototype.processMessage=originals.process;ConversationService.prototype.getOrCreate=originals.get;}
});
