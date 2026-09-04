const test=require('node:test');const assert=require('node:assert/strict');
process.env.SUPABASE_URL='http://localhost';process.env.SUPABASE_SERVICE_ROLE_KEY='test';
const supabasePath=require.resolve('../dist/database/supabase');
test('only ADMIN lists and creates stores with validated names',async t=>{
 let role='LOJA',writes=0;const rows=[{id:'00000000-0000-4000-8000-000000000001',slug:'dom',name:'Dom',active:true}];
 const fake={from(){return{select(){return this},eq(){return this},order:async()=>({data:rows,error:null}),insert(value){writes++;this.value=value;return this},single:async function(){return{data:{...this.value},error:null}}}}};
 require.cache[supabasePath]={id:supabasePath,filename:supabasePath,loaded:true,exports:{supabase:fake}};
 const router=require('../dist/stores/store.routes').default,express=require('express');const app=express();app.use(express.json());app.use((req,_res,next)=>{req.auth={id:'x',role,storeId:rows[0].id};next()});app.use('/stores',router);
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));t.after(()=>server.close());const url=`http://127.0.0.1:${server.address().port}/stores`;
 assert.equal((await fetch(url)).status,403);assert.equal((await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:'Centro'})})).status,403);assert.equal(writes,0);
 role='ADMIN';assert.equal((await fetch(url)).status,200);assert.equal((await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:' '})})).status,400);const created=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:'Dom Centro'})});assert.equal(created.status,201);assert.equal((await created.json()).slug,'dom-centro');assert.equal(writes,1);
});
