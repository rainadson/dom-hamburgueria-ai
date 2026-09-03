const {test}=require('node:test');const assert=require('node:assert/strict');
process.env.SUPABASE_URL='https://example.supabase.co';process.env.SUPABASE_SERVICE_ROLE_KEY='test';
const {ProductRepository}=require('../dist/products/product.repository');const router=require('../dist/products/product.routes').default;
test('LOJA can read catalog but only ADMIN can mutate products',async()=>{
 const proto=ProductRepository.prototype;const originals={find:proto.findAllAdmin,create:proto.create,update:proto.update,delete:proto.delete};let role='LOJA',writes=0;
 proto.findAllAdmin=async()=>[{id:1,name:'Fictício',price:1,active:true}];proto.create=async data=>{writes++;return{id:2,...data}};proto.update=async(id,data)=>{writes++;return{id,...data}};proto.delete=async()=>{writes++;};
 const express=require('express');const app=express();app.use(express.json());app.use((req,_res,next)=>{req.auth={id:'operator',role};next();});app.use('/products',router);const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const base=`http://127.0.0.1:${server.address().port}/products`;const request=(method,path='',body)=>fetch(base+path,{method,headers:{'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
 try{
  assert.equal((await request('GET')).status,200);
  for(const [method,path,body] of [['POST','',{name:'X',price:1}],['PUT','/1',{active:false}],['DELETE','/1']])assert.equal((await request(method,path,body)).status,403);
  assert.equal(writes,0);role='ADMIN';assert.equal((await request('POST','',{name:'X',price:1})).status,201);assert.equal((await request('PUT','/1',{active:false})).status,200);assert.equal((await request('DELETE','/1')).status,204);assert.equal(writes,3);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));Object.assign(proto,originals);}
});
