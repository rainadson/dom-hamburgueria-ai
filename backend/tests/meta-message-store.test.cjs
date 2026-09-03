const {test}=require('node:test');
const assert=require('node:assert/strict');
process.env.SUPABASE_URL='https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY='test';
const {supabase}=require('../dist/database/supabase');
const {MetaMessageStore}=require('../dist/whatsapp/meta-message-store');
const envelope=(extra={})=>({object:'whatsapp_business_account',entry:[{id:'123',changes:[{field:'messages',value:{messaging_product:'whatsapp',metadata:{phone_number_id:'456'},messages:[{id:'wamid.test',from:'351999999999',timestamp:'1234',type:'text',text:{body:'Olá'}}],...extra}}]}]});
test('retry sends stable message identity even when envelope changes; database failures propagate',async()=>{
 const previous=supabase.rpc;const calls=[];let fail=false;
 supabase.rpc=async(name,args)=>{assert.equal(name,'store_whatsapp_messages');calls.push(args);return {error:fail?{message:'conflict'}:null};};
 try{
  const store=new MetaMessageStore({accountId:'123',phoneNumberId:'456'});
  await store.persist(envelope());await store.persist(envelope({contacts:[]}));
  assert.notEqual(calls[0].p_event_key,calls[1].p_event_key);
  assert.deepEqual(calls[0].p_messages,calls[1].p_messages);
  fail=true;await assert.rejects(store.persist(envelope()),/guardar/);
 }finally{supabase.rpc=previous;}
});
test('invalid batch cannot reach storage and wrong destination contributes no messages',async()=>{
 const previous=supabase.rpc;let calls=0;
 supabase.rpc=async(_name,args)=>{calls++;assert.deepEqual(args.p_messages,[]);return {error:null};};
 try{
  const store=new MetaMessageStore({accountId:'123',phoneNumberId:'456'});
  await assert.rejects(store.persist(envelope({messages:[{}]})));assert.equal(calls,0);
  await store.persist(envelope({metadata:{phone_number_id:'789'}}));assert.equal(calls,1);
 }finally{supabase.rpc=previous;}
});
