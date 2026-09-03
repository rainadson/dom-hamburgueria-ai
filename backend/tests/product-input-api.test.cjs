const {test}=require('node:test');const assert=require('node:assert/strict');
process.env.SUPABASE_URL='https://example.supabase.co';process.env.SUPABASE_SERVICE_ROLE_KEY='test';
const {ProductRepository}=require('../dist/products/product.repository');
const router=require('../dist/products/product.routes').default;
test('product HTTP validation accepts UI payloads and prevents invalid repository writes',async()=>{
 const proto=ProductRepository.prototype;const originals={create:proto.create,update:proto.update,delete:proto.delete};let writes=[];
 proto.create=async data=>{writes.push(data);return {id:1,...data};};proto.update=async(id,data)=>{writes.push(data);return {id,...data};};proto.delete=async id=>writes.push(id);
 const express=require('express');const app=express();app.use(express.json());app.use('/products',router);
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const base=`http://127.0.0.1:${server.address().port}/products`;
 const send=(method,path,body)=>fetch(base+path,{method,headers:{'content-type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});
 try{
  assert.equal((await send('POST','',{name:'X',price:-1})).status,400);
  assert.equal((await send('PUT','/1',{price:1.001})).status,400);
  assert.equal((await send('PUT','/invalid',{active:true})).status,400);
  assert.equal((await send('DELETE','/-1')).status,400);assert.equal(writes.length,0);
  const created=await send('POST','',{name:'Fictício',price:8.99,active:true});assert.equal(created.status,201);
  const updated=await send('PUT','/1',{id:999,created_at:'old',name:'Fictício',price:'8.99',active:false});assert.equal(updated.status,200);const data=await updated.json();assert.equal(data.id,1);assert.equal(data.active,false);assert.equal(data.created_at,undefined);
  assert.equal((await send('PUT','/1',{active:true})).status,200);assert.equal(writes.length,3);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));Object.assign(proto,originals);}
});
