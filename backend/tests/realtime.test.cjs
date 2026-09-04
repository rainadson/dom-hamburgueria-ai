const {test}=require('node:test');
const assert=require('node:assert/strict');
process.env.SUPABASE_URL='https://example.supabase.co';process.env.SUPABASE_SERVICE_ROLE_KEY='test';process.env.GROQ_API_KEY='test';

test('realtime stream is store-scoped, emits only a topic and releases its subscription',async()=>{
 const express=require('express');
 const events=require('../dist/realtime/realtime-events').realtimeEvents;
 const router=require('../dist/realtime/realtime.routes').default;
 const original=events.subscribe.bind(events);let captured;let released=0;
 events.subscribe=(storeId,topics,notify)=>{captured={storeId,topics};setTimeout(()=>notify('orders'),5);return()=>{released++};};
 const app=express();app.use((req,res,next)=>{req.auth={id:'operator',role:'LOJA',storeId:'00000000-0000-4000-8000-000000000001'};next();});app.use('/realtime',router);
 const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));const base=`http://127.0.0.1:${server.address().port}/realtime`;
 try{
  assert.equal((await fetch(base+'?topics=unknown')).status,400);
  const response=await fetch(base+'?topics=orders');assert.equal(response.status,200);assert.match(response.headers.get('content-type'),/text\/event-stream/);
  const reader=response.body.getReader();let text='';
  while(!text.includes('event: change')){const part=await reader.read();text+=new TextDecoder().decode(part.value);}
  assert.deepEqual(captured,{storeId:'00000000-0000-4000-8000-000000000001',topics:['orders']});
  assert.match(text,/data: \{"topic":"orders"\}/);assert.doesNotMatch(text,/customer|phone|total|items/);
  await reader.cancel();await new Promise(resolve=>setTimeout(resolve,10));assert.equal(released,1);
 }finally{events.subscribe=original;server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
