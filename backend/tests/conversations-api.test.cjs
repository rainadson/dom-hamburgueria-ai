const {test}=require('node:test');const assert=require('node:assert/strict');
process.env.SUPABASE_URL='https://example.supabase.co';process.env.SUPABASE_SERVICE_ROLE_KEY='test';process.env.GROQ_API_KEY='test';
const {supabase}=require('../dist/database/supabase');
const {requireAuth}=require('../dist/middlewares/auth.middleware');
const router=require('../dist/conversation/conversation.routes').default;
test('conversation API requires valid role, supports both roles and excludes raw draft/system history',async()=>{
 const originalFrom=supabase.from;const originalUser=supabase.auth.getUser;
 const row={id:1,phone:'fictional',state:'PAYMENT',updated_at:new Date().toISOString(),order_draft:{customer_name:'Teste',total:99},history:[{role:'system',content:'internal'},{role:'user',content:'ola'}]};
 let role='LOJA';let filter='';
 supabase.auth.getUser=async token=>({data:{user:token==='valid'?{id:'test'}:null}});
 supabase.from=table=>{const query={select(){return this},eq(){return this},order(){return this},or(value){filter=value;return this},range:async()=>({data:[row],count:1}),maybeSingle:async()=>({data:row}),single:async()=>({data:{role,store_id:'00000000-0000-4000-8000-000000000001'}})};return query;};
 const express=require('express');const app=express();app.use('/conversations',requireAuth,router);const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
 const base=`http://127.0.0.1:${server.address().port}/conversations`;
 try{
  assert.equal((await fetch(base)).status,401);
  assert.equal((await fetch(base,{headers:{authorization:'Bearer invalid'}})).status,401);
  for(role of ['LOJA','ADMIN']){const headers={authorization:'Bearer valid'};const list=await (await fetch(base+'?search=Teste',{headers})).json();assert.equal(list.items[0].name,'Teste');assert.equal(list.items[0].order_draft,undefined);assert.match(filter,/customer_name/);const d=await(await fetch(base+'/1',{headers})).json();assert.deepEqual(d.history,[{role:'user',content:'ola'}]);assert.equal(d.order_draft,undefined);assert.equal((await fetch(base+'?page=-1',{headers})).status,400);}
  role='OTHER';assert.equal((await fetch(base,{headers:{authorization:'Bearer valid'}})).status,403);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));supabase.from=originalFrom;supabase.auth.getUser=originalUser;}
});
