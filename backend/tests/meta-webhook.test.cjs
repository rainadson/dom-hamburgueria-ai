const {test}=require('node:test');const assert=require('node:assert/strict');const {createHmac}=require('node:crypto');const express=require('express');
const {validMetaSignature,createMetaWebhook}=require('../dist/whatsapp/meta-webhook');
const secret='fictional-app-secret';const token='fictional-verification';const body=JSON.stringify({object:'whatsapp_business_account',entry:[]});
const sign=text=>'sha256='+createHmac('sha256',secret).update(text).digest('hex');
test('signature binds exact raw bytes and rejects malformed/absent signatures',()=>{assert.equal(validMetaSignature(Buffer.from(body),sign(body),secret),true);for(const signature of [null,'','sha256=zz','sha256='+'0'.repeat(64),sign(body+' ')])assert.equal(validMetaSignature(Buffer.from(body),signature,secret),false);assert.equal(validMetaSignature(Buffer.from(body),sign(body),''),false);});
test('verification and receiving fail closed without a durable handler; ACK follows persistence only',async()=>{
 let fail=false;const events=[];const app=express();app.use('/disabled',createMetaWebhook({verifyToken:token,appSecret:secret}));app.use('/meta',createMetaWebhook({verifyToken:token,appSecret:secret},async event=>{if(fail)throw Error('storage unavailable');events.push(event)}));
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const base=`http://127.0.0.1:${server.address().port}`;
 const post=(text,signature=sign(text))=>fetch(base+'/meta',{method:'POST',headers:{'content-type':'application/json','x-hub-signature-256':signature},body:text});
 try{assert.equal((await fetch(base+'/disabled')).status,503);assert.equal((await fetch(base+'/meta?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=42')).status,403);const verification=await fetch(base+`/meta?hub.mode=subscribe&hub.verify_token=${token}&hub.challenge=0042`);assert.equal(verification.status,200);assert.equal(await verification.text(),'0042');assert.equal((await post(body,'sha256=bad')).status,403);assert.equal(events.length,0);assert.equal((await post('{')).status,400);assert.equal((await post('{}')).status,400);assert.equal((await post(body)).status,200);assert.equal(events.length,1);fail=true;assert.equal((await post(body)).status,503);assert.equal(events.length,1);}
 finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
