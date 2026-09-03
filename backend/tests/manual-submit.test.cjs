const {test}=require('node:test');const assert=require('node:assert/strict');
process.env.SUPABASE_URL='https://example.supabase.co';process.env.SUPABASE_SERVICE_ROLE_KEY='test';process.env.GROQ_API_KEY='test';
const {ManualOrderSubmit}=require('../dist/orders/manual-order-submit');
const key='12345678-1234-4234-8234-123456789012';
function setup(){const s=new ManualOrderSubmit();const rows=new Map();let writes=0;
 s.calculator={preview:async()=>({total:8.99,items:[{product:'Dom Tradicional',quantity:1}]})};
 s.find=async(actor,key)=>rows.get(actor+key)||null;
 s.insert=async p=>{const k=p.manual_actor_id+p.manual_request_id;if(rows.has(k))return {error:{code:'23505'}};writes++;const row={...p,id:writes};rows.set(k,row);return {data:{id:row.id}};};return {s,rows,writes:()=>writes};}
test('sequential retry reuses persistent record even when current pricing is unavailable',async()=>{const f=setup();const a=await f.s.submit('actor',key,{a:1,b:2},8.99);f.s.calculator.preview=async()=>{throw Error('unavailable')};const b=await f.s.submit('actor',key,{b:2,a:1},8.99);assert.equal(a.id,b.id);assert.equal(b.replayed,true);assert.equal(f.writes(),1);});
test('simultaneous requests converge to one inserted order via unique constraint',async()=>{const f=setup();const results=await Promise.all([f.s.submit('actor',key,{},8.99),f.s.submit('actor',key,{},8.99)]);assert.equal(results[0].id,results[1].id);assert.equal(f.writes(),1);});
test('changed payload cannot reuse key; different operators are isolated',async()=>{const f=setup();await f.s.submit('actor',key,{name:'A'},8.99);await assert.rejects(f.s.submit('actor',key,{name:'B'},8.99),e=>e.status===409);await f.s.submit('other',key,{name:'B'},8.99);assert.equal(f.writes(),2);});
test('changed price or invalid request identifier cannot insert',async()=>{const f=setup();await assert.rejects(f.s.submit('actor',key,{},9.99),e=>e.status===409);await assert.rejects(f.s.submit('actor','bad',{},8.99),e=>e.status===400);assert.equal(f.writes(),0);});
test('uncertain response after successful insertion can be retried without another order',async()=>{const f=setup();const insert=f.s.insert;f.s.insert=async p=>{await insert(p);return {error:{code:'NETWORK'}}};await assert.rejects(f.s.submit('actor',key,{},8.99),e=>e.status===503);const retry=await f.s.submit('actor',key,{},8.99);assert.equal(retry.replayed,true);assert.equal(f.writes(),1);});
test('HTTP confirmation is disabled by default and requires auth and explicit review when enabled',async()=>{
 const express=require('express');const router=require('../dist/orders/order.routes').default;
 const app=express();app.use(express.json());app.use((req,res,next)=>{if(req.header('x-test-auth'))req.auth={id:'actor',role:'LOJA'};next()});app.use('/orders',router);
 const previous=process.env.MANUAL_ORDER_SUBMIT_ENABLED;delete process.env.MANUAL_ORDER_SUBMIT_ENABLED;
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const url=`http://127.0.0.1:${server.address().port}/orders/manual/confirm`;
 try{assert.equal((await fetch(url,{method:'POST'})).status,503);process.env.MANUAL_ORDER_SUBMIT_ENABLED='true';assert.equal((await fetch(url,{method:'POST'})).status,401);assert.equal((await fetch(url,{method:'POST',headers:{'x-test-auth':'yes','content-type':'application/json'},body:'{}'})).status,400);}
 finally{if(previous===undefined)delete process.env.MANUAL_ORDER_SUBMIT_ENABLED;else process.env.MANUAL_ORDER_SUBMIT_ENABLED=previous;server.closeAllConnections();await new Promise(r=>server.close(r));}
});
