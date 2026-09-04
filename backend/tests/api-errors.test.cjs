const {test}=require('node:test');const assert=require('node:assert/strict');
process.env.SUPABASE_URL='https://example.supabase.co';process.env.SUPABASE_SERVICE_ROLE_KEY='test';
const {supabase}=require('../dist/database/supabase');
const {handleApiError}=require('../dist/middlewares/error.middleware');
const {requestContext}=require('../dist/middlewares/request-context.middleware');
const dashboard=require('../dist/routes/dashboard.routes').default;
test('unexpected failures and malformed/oversized bodies return safe JSON errors',async()=>{
 const express=require('express');const app=express();app.use(requestContext);app.use(express.json({limit:100}));app.post('/input',(_req,res)=>res.json({ok:true}));app.get('/error',async()=>{throw Error('PRIVATE_INTERNAL_DETAIL');});app.use(handleApiError);
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const base=`http://127.0.0.1:${server.address().port}`;
 try{for(const [path,options,status] of [['/error',{},500],['/input',{method:'POST',headers:{'content-type':'application/json'},body:'{"PRIVATE_BODY":'},400],['/input',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({text:'x'.repeat(200)})},413]]){const response=await fetch(base+path,options);assert.equal(response.status,status);assert.match(response.headers.get('content-type'),/json/);assert.match(response.headers.get('x-request-id'),/^[0-9a-f-]{36}$/);assert.doesNotMatch(await response.text(),/PRIVATE|stack|Error:/);}}finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
test('dashboard reports unavailable data rather than zero on database failure',async()=>{
 const previous=supabase.from;let failTable='orders',revenueFail=false;
 supabase.from=table=>{let revenue=false;const q={select(fields){revenue=fields==='total';return q;},eq(){return q;},then(resolve,reject){return Promise.resolve({count:3,data:[{total:10}],error:table===failTable||(revenue&&revenueFail)?{message:'PRIVATE_DB_DETAIL'}:null}).then(resolve,reject);}};return q;};
 const app=require('express')();app.use((req,_res,next)=>{req.auth={id:'test',role:'ADMIN'};next();});app.use(dashboard);
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const base=`http://127.0.0.1:${server.address().port}`;
 try{for(failTable of ['orders','products']){const response=await fetch(base);assert.equal(response.status,500);assert.doesNotMatch(await response.text(),/PRIVATE|totalRevenue/);}failTable='';revenueFail=true;assert.equal((await fetch(base)).status,500);revenueFail=false;const ok=await fetch(base);assert.equal(ok.status,200);assert.equal((await ok.json()).totalRevenue,10);}finally{server.closeAllConnections();await new Promise(r=>server.close(r));supabase.from=previous;}
});
