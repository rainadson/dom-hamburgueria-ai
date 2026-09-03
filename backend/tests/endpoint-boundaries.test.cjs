const {test}=require('node:test');const assert=require('node:assert/strict');
process.env.SUPABASE_URL='https://example.supabase.co';process.env.SUPABASE_SERVICE_ROLE_KEY='test';process.env.GROQ_API_KEY='test';
const {supabase}=require('../dist/database/supabase');

test('every operational API boundary requires authentication and unknown APIs return safe JSON',async()=>{
 const original=supabase.auth.getUser;let authLookups=0;supabase.auth.getUser=async()=>{authLookups++;return{data:{user:null}}};
 const app=require('../dist/app').default;const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const base=`http://127.0.0.1:${server.address().port}`;
 const requests=[
  ['GET','/api/whatsapp/status'],['GET','/api/conversations'],['GET','/api/conversations/1'],
  ['POST','/api/conversations/1/take'],['POST','/api/conversations/1/draft'],['POST','/api/conversations/1/resume'],
  ['GET','/api/orders'],['GET','/api/orders/kitchen'],['GET','/api/orders/manual/capabilities'],['GET','/api/orders/manual/customers'],
  ['POST','/api/orders/manual/preview'],['POST','/api/orders/manual/confirm'],['PATCH','/api/orders/1/status'],
  ['GET','/api/products'],['GET','/api/products/1'],['POST','/api/products'],['PUT','/api/products/1'],['DELETE','/api/products/1'],
  ['GET','/api/dashboard'],['POST','/api/chat']
 ];
 try{
  for(const [method,path] of requests){const response=await fetch(base+path,{method,headers:{'content-type':'application/json'},...(method==='GET'?{}:{body:'{}'})});assert.equal(response.status,401,`${method} ${path}`);assert.deepEqual(await response.json(),{message:'Token de autenticação ausente.'});}
  assert.equal(authLookups,0);
  for(const [method,path] of [['GET','/api/not-found'],['GET','/api/test-db'],['POST','/api/webhook']]){const response=await fetch(base+path,{method,headers:{'content-type':'application/json'},...(method==='POST'?{body:'{}'}:{})});assert.equal(response.status,404);assert.deepEqual(await response.json(),{message:'Endpoint não encontrado.'});}
  assert.equal((await fetch(base+'/')).status,200);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));supabase.auth.getUser=original;}
});

test('conversation history rejects unsafe identifiers before database access',async()=>{
 const original=supabase.from;let queries=0;supabase.from=()=>{queries++;throw new Error('database must not be queried')};
 const express=require('express');const router=require('../dist/conversation/conversation.routes').default;const app=express();app.use((req,_res,next)=>{req.auth={id:'operator',role:'LOJA'};next()});app.use('/conversations',router);const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const base=`http://127.0.0.1:${server.address().port}/conversations`;
 try{for(const id of ['0','-1','1e2','9007199254740992','texto']){const response=await fetch(`${base}/${id}`);assert.equal(response.status,400,id);assert.deepEqual(await response.json(),{message:'Conversa inválida.'});}assert.equal(queries,0);}
 finally{server.closeAllConnections();await new Promise(r=>server.close(r));supabase.from=original;}
});
