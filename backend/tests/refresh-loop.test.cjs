const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const vm=require('node:vm');const ts=require('typescript');const path=require('node:path');
function setup(read){
 const timers=new Map();let id=0;const received=[];let failures=0;
 const context={exports:{},AbortController,setTimeout(fn,delay){timers.set(++id,{fn,delay});return id;},clearTimeout(id){timers.delete(id);}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,'../../frontend/src/services/refresh-loop.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,context);
 const loop=context.exports.createRefreshLoop({read,receive:v=>received.push(v),failure:()=>failures++,delay:5000});
 return {loop,timers,received,failures:()=>failures};
}
test('overlapping refresh waits for active read then requests fresh data',async()=>{
 let resolve;let calls=0;const s=setup(()=>{calls++;return new Promise(r=>resolve=r);});
 const first=s.loop.refresh();await s.loop.refresh();assert.equal(calls,1);
 resolve('before status change');await first;assert.equal(s.timers.size,1);
 const scheduled=[...s.timers.values()][0];assert.equal(scheduled.delay,0);
 const next=scheduled.fn();assert.equal(calls,2);resolve('after status change');await next;
 assert.deepEqual(s.received,['before status change','after status change']);s.loop.stop();
});
test('unmount aborts pending read and suppresses late data and timers',async()=>{
 let resolve,signal;const s=setup(sg=>{signal=sg;return new Promise(r=>resolve=r);});
 const pending=s.loop.refresh();s.loop.stop();assert.equal(signal.aborted,true);
 resolve('late');await pending;assert.deepEqual(s.received,[]);assert.equal(s.timers.size,0);
});
test('failed read keeps previous data and schedules recovery',async()=>{
 let fail=false;const s=setup(async()=>{if(fail)throw Error('offline');return 'orders';});
 await s.loop.refresh();fail=true;await s.loop.refresh();assert.deepEqual(s.received,['orders']);assert.equal(s.failures(),1);
 assert.equal([...s.timers.values()][0].delay,5000);s.loop.stop();
});

test('stopped detail reader cannot overwrite a replacement reader or report late failure',async()=>{
 let reject;const old=setup(()=>new Promise((_resolve,r)=>reject=r));
 const pending=old.loop.refresh();old.loop.stop();
 const fresh=setup(async()=> 'new conversation after action');await fresh.loop.refresh();
 reject(Error('late aborted request'));await pending;
 assert.equal(old.failures(),0);assert.equal(old.timers.size,0);assert.deepEqual(old.received,[]);
 assert.deepEqual(fresh.received,['new conversation after action']);fresh.loop.stop();
});
