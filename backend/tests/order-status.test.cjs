const {test}=require('node:test');const assert=require('node:assert/strict');
process.env.SUPABASE_URL='https://example.supabase.co';process.env.SUPABASE_SERVICE_ROLE_KEY='test';
const {supabase}=require('../dist/database/supabase');
const {OrderRepository}=require('../dist/orders/order.repository');
test('conditional update prevents a second operator overwriting a changed status',async()=>{
 const previous=supabase.from;let stored='PENDING';
 supabase.from=table=>{assert.equal(table,'orders');const filters={};let next;const q={update(value){next=value.status;return q;},eq(k,v){filters[k]=v;return q;},select(){return q;},async maybeSingle(){assert.equal(filters.id,1);if(filters.status!==undefined&&filters.status!==stored)return {data:null,error:null};stored=next;return {data:{id:1,status:stored},error:null};}};return q;};
 try{const repo=new OrderRepository();await repo.updateStatus(1,'PREPARING','PENDING');await assert.rejects(repo.updateStatus(1,'CANCELLED','PENDING'),e=>e.statusCode===409);assert.equal(stored,'PREPARING');await repo.updateStatus(1,'READY','PREPARING');assert.equal(stored,'READY');await repo.updateStatus(1,'DELIVERED');assert.equal(stored,'DELIVERED');}finally{supabase.from=previous;}
});
test('invalid writes fail before database access',async()=>{
 const previous=supabase.from;supabase.from=()=>{throw Error('unexpected database call');};
 try{for(const args of [[0,'READY'],[1.2,'READY'],[1,'INVALID'],[1,'READY',null],[1,'READY','INVALID']])await assert.rejects(new OrderRepository().updateStatus(...args),e=>e.statusCode===400);}finally{supabase.from=previous;}
});
