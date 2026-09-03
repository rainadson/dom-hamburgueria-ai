const {test}=require('node:test');const assert=require('node:assert/strict');
process.env.SUPABASE_URL='https://example.supabase.co';process.env.SUPABASE_SERVICE_ROLE_KEY='test';
const {supabase}=require('../dist/database/supabase');
const {OrderRepository,OrderStatusError}=require('../dist/orders/order.repository');
const {requireAuth}=require('../dist/middlewares/auth.middleware');
const router=require('../dist/orders/order.routes').default;
test('status API preserves roles, forwards expected state and hides unexpected errors',async()=>{
 const originals={from:supabase.from,user:supabase.auth.getUser,update:OrderRepository.prototype.updateStatus};
 let role='LOJA',mode='ok',calls=0;
 supabase.auth.getUser=async token=>({data:{user:token==='valid'?{id:'actor'}:null}});
 supabase.from=()=>({select(){return this},eq(){return this},single:async()=>({data:{role}})});
 OrderRepository.prototype.updateStatus=async(id,status,expected)=>{calls++;assert.deepEqual([id,status,expected],[1,'READY','PREPARING']);if(mode==='conflict')throw new OrderStatusError(409,'O pedido mudou.');if(mode==='failure')throw Error('PRIVATE_DATABASE_DETAIL');return {id,status};};
 const app=require('express')();app.use(require('express').json());app.use('/orders',requireAuth,router);
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
 const url=`http://127.0.0.1:${server.address().port}/orders/1/status`;
 const send=(token)=>fetch(url,{method:'PATCH',headers:{'content-type':'application/json',...(token?{authorization:`Bearer ${token}`}:{})},body:JSON.stringify({status:'READY',expected_status:'PREPARING'})});
 try{
  assert.equal((await send()).status,401);assert.equal((await send('invalid')).status,401);assert.equal(calls,0);
  for(role of ['LOJA','ADMIN'])assert.equal((await send('valid')).status,200);
  role='OTHER';assert.equal((await send('valid')).status,403);assert.equal(calls,2);
  role='LOJA';mode='conflict';assert.equal((await send('valid')).status,409);
  mode='failure';const failed=await send('valid');assert.equal(failed.status,500);assert.doesNotMatch(await failed.text(),/PRIVATE_DATABASE_DETAIL/);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));supabase.from=originals.from;supabase.auth.getUser=originals.user;OrderRepository.prototype.updateStatus=originals.update;}
});
