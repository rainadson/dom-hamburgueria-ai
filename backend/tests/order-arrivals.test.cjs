const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const vm=require('node:vm');const ts=require('typescript');const path=require('node:path');
const context={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,'../../frontend/src/services/order-arrivals.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,context);
const {createOrderArrivalTracker}=context.exports;
test('first load is silent but first order after an empty kitchen is detected',()=>{
 const arrivals=createOrderArrivalTracker();assert.equal(arrivals.receive([]),false);assert.equal(arrivals.receive([1]),true);assert.equal(arrivals.receive([1]),false);
 const existing=createOrderArrivalTracker();assert.equal(existing.receive([1,2]),false);
});
test('arrival detection uses identity rather than count or sorting',()=>{
 const arrivals=createOrderArrivalTracker();arrivals.receive([1,2]);
 assert.equal(arrivals.receive([2,1]),false);assert.equal(arrivals.receive([2]),false);
 assert.equal(arrivals.receive([3]),true);assert.equal(arrivals.receive([3]),false);
});
