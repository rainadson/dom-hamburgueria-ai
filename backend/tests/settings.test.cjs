const {test}=require('node:test');const assert=require('node:assert/strict');
process.env.SUPABASE_URL='https://example.supabase.co';process.env.SUPABASE_SERVICE_ROLE_KEY='test';process.env.GROQ_API_KEY='test';
const {settingsInput,SettingsInputError}=require('../dist/settings/settings-input');
const {SettingsRepository}=require('../dist/settings/settings.repository');
const {buildSystemPrompt}=require('../dist/prompts/system.prompt');
test('settings validate official values and reject unsupported payment methods',()=>{
 const value=settingsInput({restaurant_name:' Dom Hamburgueria ',phone:'+351 912 345 678',address:'Rua A',opening_hours:'18h–23h',delivery_fee:null,delivery_fee_rules:[{max_km:4,fee:4},{max_km:8,fee:6},{max_km:12,fee:9}],payment_methods:['DINHEIRO','MULTIBANCO'],ai_greeting:'Olá!',ai_unknown_reply:'Pode repetir?',ai_personality:'Breve e simpática.'});
 assert.equal(value.restaurant_name,'Dom Hamburgueria');assert.deepEqual(value.delivery_fee_rules,[{max_km:4,fee:4},{max_km:8,fee:6},{max_km:12,fee:9}]);assert.deepEqual(value.payment_methods,['DINHEIRO','MULTIBANCO']);
 assert.throws(()=>settingsInput({...value,payment_methods:['PIX']}),SettingsInputError);
 assert.throws(()=>settingsInput({...value,delivery_fee:-1}),SettingsInputError);
});
test('configured identity and messages are inserted into the AI prompt',()=>{
 const prompt=buildSystemPrompt('MENU',{restaurant_name:'Loja Teste',ai_personality:'Direta.',ai_greeting:'Bem-vindo!',ai_unknown_reply:'Repita.'});
 for(const text of ['Loja Teste','Direta.','Bem-vindo!','Repita.'])assert.match(prompt,new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
});
test('LOJA reads settings while only ADMIN can update its own store',async()=>{
 const router=require('../dist/settings/settings.routes').default;const proto=SettingsRepository.prototype;const originals={get:proto.get,save:proto.save};let role='LOJA',writes=0,store;
 proto.get=async function(){return{restaurant_name:'Dom Hamburgueria',payment_methods:['DINHEIRO','MULTIBANCO']}};
 proto.save=async function(value){writes++;store=this.storeId;return value};
 const express=require('express');const app=express();app.use(express.json());app.use((req,_res,next)=>{req.auth={id:'operator',role,storeId:'00000000-0000-4000-8000-000000000001'};next()});app.use('/settings',router);
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const url=`http://127.0.0.1:${server.address().port}/settings`;const payload={restaurant_name:'Dom Hamburgueria',delivery_fee_rules:[{max_km:4,fee:4},{max_km:8,fee:6},{max_km:12,fee:9}],payment_methods:['DINHEIRO','MULTIBANCO']};
 try{assert.equal((await fetch(url)).status,200);assert.equal((await fetch(url,{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(payload)})).status,403);assert.equal(writes,0);role='ADMIN';assert.equal((await fetch(url,{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(payload)})).status,200);assert.equal(writes,1);assert.equal(store,'00000000-0000-4000-8000-000000000001');}
 finally{Object.assign(proto,originals);server.closeAllConnections();await new Promise(r=>server.close(r));}
});
