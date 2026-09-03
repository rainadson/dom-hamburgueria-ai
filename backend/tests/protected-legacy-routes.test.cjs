const {test}=require('node:test');const assert=require('node:assert/strict');
process.env.SUPABASE_URL='https://example.supabase.co';process.env.SUPABASE_SERVICE_ROLE_KEY='test';process.env.GROQ_API_KEY='test';
const {supabase}=require('../dist/database/supabase');const {ConversationService}=require('../dist/conversation/conversation.service');
test('app removes legacy endpoints and chat requires an authenticated panel role',async()=>{
 const originals={from:supabase.from,user:supabase.auth.getUser,process:ConversationService.prototype.processMessage};let role='LOJA',calls=0;
 supabase.auth.getUser=async token=>({data:{user:token==='valid'?{id:'operator',email:'operator@example.invalid'}:null}});
 supabase.from=table=>{assert.equal(table,'user_profiles');return {select(){return this},eq(){return this},single:async()=>({data:{role},error:null})};};
 ConversationService.prototype.processMessage=async(phone,message)=>{calls++;return {phone,ai:{reply:message}};};
 const app=require('../dist/app').default;const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const base=`http://127.0.0.1:${server.address().port}/api`;
 const send=(token)=>fetch(base+'/chat',{method:'POST',headers:{'content-type':'application/json',...(token?{authorization:`Bearer ${token}`}:{})},body:JSON.stringify({phone:'demo-reuniao',message:'Olá'})});
 try{
  assert.equal((await send()).status,401);assert.equal((await send('invalid')).status,401);assert.equal(calls,0);
  for(role of ['LOJA','ADMIN']){const response=await send('valid');assert.equal(response.status,200);assert.equal((await response.json()).ai.reply,'Olá');}
  role='OTHER';assert.equal((await send('valid')).status,403);assert.equal(calls,2);
  for(const path of ['/test-db','/webhook']){const get=await fetch(base+path);assert.equal(get.status,404);const post=await fetch(base+path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({phone:'demo-reuniao',message:'Olá'})});assert.equal(post.status,404);}
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));supabase.from=originals.from;supabase.auth.getUser=originals.user;ConversationService.prototype.processMessage=originals.process;}
});
