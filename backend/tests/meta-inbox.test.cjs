const {test}=require('node:test');const assert=require('node:assert/strict');
process.env.SUPABASE_URL='https://example.supabase.co';process.env.SUPABASE_SERVICE_ROLE_KEY='test';
const {supabase}=require('../dist/database/supabase');const {inboxEnvelope,MetaInbox}=require('../dist/whatsapp/meta-inbox');
test('envelope identity is stable across object key ordering but retains different payloads',()=>{
 const first={object:'whatsapp_business_account',entry:[{id:'test-waba',changes:[]}]};
 const reordered={entry:[{changes:[],id:'test-waba'}],object:'whatsapp_business_account'};
 assert.equal(inboxEnvelope(first).event_key,inboxEnvelope(reordered).event_key);
 assert.notEqual(inboxEnvelope(first).event_key,inboxEnvelope({...first,entry:[]}).event_key);
 assert.deepEqual(inboxEnvelope(first).payload,first);
});
test('invalid and oversized envelopes fail before persistence',()=>{for(const value of [null,{},undefined,{object:'wrong',entry:[]},{object:'whatsapp_business_account',entry:'invalid'},{object:'whatsapp_business_account',entry:[],data:'x'.repeat(1024*1024)}])assert.throws(()=>inboxEnvelope(value));});
test('duplicate receipt never overwrites completed processing and database errors propagate',async()=>{
 const previous=supabase.from;const records=new Map();let fail=false;
 supabase.from=table=>{assert.equal(table,'whatsapp_inbox');return {upsert:async(row,options)=>{assert.deepEqual(options,{onConflict:'event_key',ignoreDuplicates:true});if(fail)return {error:{message:'database unavailable'}};if(!records.has(row.event_key))records.set(row.event_key,{...row,status:'PENDING'});return {error:null}}};};
 try{const inbox=new MetaInbox();const event={object:'whatsapp_business_account',entry:[]};await inbox.persist(event);records.values().next().value.status='COMPLETED';await inbox.persist(event);assert.equal(records.size,1);assert.equal(records.values().next().value.status,'COMPLETED');fail=true;await assert.rejects(inbox.persist(event),/guardar/);}finally{supabase.from=previous;}
});
