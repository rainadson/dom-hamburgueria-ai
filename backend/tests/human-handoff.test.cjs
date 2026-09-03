const {test}=require('node:test');const assert=require('node:assert/strict');
process.env.SUPABASE_URL='https://example.supabase.co';process.env.SUPABASE_SERVICE_ROLE_KEY='test';process.env.GROQ_API_KEY='test';
const {supabase}=require('../dist/database/supabase');
const {HumanHandoffService}=require('../dist/conversation/human-handoff.service');
const {ConversationService}=require('../dist/conversation/conversation.service');
const {withConversationLock}=require('../dist/conversation/conversation-lock');
const owner={id:'owner',role:'LOJA'};const other={id:'other',role:'ADMIN'};
function setup(t){
 const row={id:1,phone:'handoff-test',state:'PAYMENT',history:[{role:'assistant',content:'Como deseja pagar?'}],order_draft:{items:[{product:'Dom Tradicional',quantity:1}],checkout_step:'PAYMENT',total:8.99}};
 const original=supabase.from;let writes=0;
 supabase.from=()=>({select(){return this},eq(){return this},maybeSingle:async()=>({data:structuredClone(row)}),update:patch=>({eq:async()=>{writes++;Object.assign(row,structuredClone(patch));return {error:null}}})});
 t.after(()=>{supabase.from=original});
 const service=new HumanHandoffService();const chat=new ConversationService();
 chat.repository={findByPhone:async()=>structuredClone(row),updateHistory:async(_,h)=>row.history=structuredClone(h),updateDraft:async(_,d)=>row.order_draft=structuredClone(d),updateState:async(_,s)=>row.state=s};
 chat.aiService={generateResponse:async()=>{throw Error('AI must not run')}};
 chat.orderService={saveOrder:async()=>{throw Error('No kitchen orders')}};
 return {row,service,chat,writes:()=>writes};
}
for(const role of ['ADMIN','LOJA'])test(`${role}: take, draft and resume preserve checkout and never claim delivery`,async t=>{
 const f=setup(t);const actor={...owner,role};await f.service.act(1,actor,'take');assert.equal(f.row.order_draft.handoff.owner_id,actor.id);
 const result=await f.service.act(1,actor,'draft','Resposta preparada');assert.equal(result.delivery,'not_sent');assert.equal(f.row.order_draft.handoff.response_draft,'Resposta preparada');assert.ok(!f.row.history.some(m=>m.content==='Resposta preparada'));
 await f.service.act(1,actor,'resume');assert.equal(f.row.order_draft.handoff.active,false);assert.equal(f.row.state,'PAYMENT');assert.equal(f.row.order_draft.checkout_step,'PAYMENT');assert.equal(f.row.order_draft.total,8.99);assert.equal(f.row.history.filter(m=>m.role==='event').length,2);
});
test('paused messages record only the customer, without AI, automatic menu or checkout changes',async t=>{
 const f=setup(t);await f.service.act(1,owner,'take');const before=structuredClone(f.row.order_draft);
 for(const text of ['manda o cardápio','sim','cancelar','dinheiro']){const result=await f.chat.processMessage(f.row.phone,text);assert.equal(result.ai.reply,'');assert.equal(result.ai.intent,'HUMAN_WAITING');assert.equal(f.row.history.at(-1).content,text);}
 assert.deepEqual(f.row.order_draft,before);assert.equal(f.row.state,'PAYMENT');
});
test('another operator cannot take over, resume or change a response draft',async t=>{
 const f=setup(t);await f.service.act(1,owner,'take');const before=structuredClone(f.row);
 for(const action of ['take','resume','draft'])await assert.rejects(f.service.act(1,other,action,'text'),e=>e.status===409);
 assert.deepEqual(f.row,before);
});
test('simultaneous take requests have one winner in the current instance',async t=>{
 const f=setup(t);const results=await Promise.allSettled([f.service.act(1,owner,'take'),f.service.act(1,other,'take')]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(f.row.history.filter(m=>m.role==='event').length,1);
});
test('duplicate take is idempotent and invalid responses do not write',async t=>{
 const f=setup(t);await f.service.act(1,owner,'take');await f.service.act(1,owner,'take');assert.equal(f.writes(),1);
 for(const text of ['',null,' '.repeat(3),'x'.repeat(4001)])await assert.rejects(f.service.act(1,owner,'draft',text),e=>e.status===400);
 assert.equal(f.writes(),1);await assert.rejects(f.service.act(1,{id:'x',role:'OTHER'},'take'),e=>e.status===403);
});
test('resume restores payment processing instead of reinterpreting stored messages',async t=>{
 const f=setup(t);await f.service.act(1,owner,'take');await f.chat.processMessage(f.row.phone,'dinheiro');await f.service.act(1,owner,'resume');assert.equal(f.row.state,'PAYMENT');await f.chat.processMessage(f.row.phone,'dinheiro');assert.equal(f.row.state,'CASH_AMOUNT');
});
test('queue releases after a rejected operation and does not block another phone',async()=>{
 const sequence=[];await assert.rejects(withConversationLock('failure',async()=>{throw Error('fail')}));await withConversationLock('failure',async()=>sequence.push('recovered'));
 let release;const gate=new Promise(r=>release=r);const first=withConversationLock('a',async()=>{await gate;sequence.push('a')});await withConversationLock('b',async()=>sequence.push('b'));release();await first;assert.deepEqual(sequence,['recovered','b','a']);
});
