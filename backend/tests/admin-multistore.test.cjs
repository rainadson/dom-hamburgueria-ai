const test=require('node:test');const assert=require('node:assert/strict');
process.env.SUPABASE_URL='http://localhost';process.env.SUPABASE_SERVICE_ROLE_KEY='test';
const supabasePath=require.resolve('../dist/database/supabase');

test('ADMIN can select an active store while LOJA remains restricted',async t=>{
 const STORE_A='00000000-0000-4000-8000-000000000001',STORE_B='00000000-0000-4000-8000-000000000002';let role='ADMIN';
 const fake={auth:{getUser:async()=>({data:{user:{id:'user',email:'x@test.pt'}},error:null})},from(table){if(table==='user_profiles')return{select(){return this},eq(){return this},single:async()=>({data:{id:1,name:'Admin',role,store_id:STORE_A},error:null})};if(table==='stores')return{select(){return this},eq(){return this},maybeSingle:async()=>({data:{id:STORE_B},error:null})};throw new Error(table)}};
 require.cache[supabasePath]={id:supabasePath,filename:supabasePath,loaded:true,exports:{supabase:fake}};
 const {requireAuth}=require('../dist/middlewares/auth.middleware');const express=require('express');const app=express();app.get('/',requireAuth,(req,res)=>res.json({store:req.auth.storeId}));
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));t.after(()=>server.close());const url=`http://127.0.0.1:${server.address().port}`;
 let response=await fetch(url,{headers:{authorization:'Bearer valid','x-store-id':STORE_B}});assert.equal(response.status,200);assert.equal((await response.json()).store,STORE_B);
 role='LOJA';response=await fetch(url,{headers:{authorization:'Bearer valid','x-store-id':STORE_B}});assert.equal(response.status,403);
});
