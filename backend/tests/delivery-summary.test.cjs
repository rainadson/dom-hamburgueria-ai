const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const ts=require('typescript');const path=require('node:path');
const context={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,'../../frontend/src/services/delivery-summary.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,context);
const {deliverySummary}=context.exports;
const order={id:99,customer_name:'Cliente fictício',customer_phone:'PHONE_PRIVATE',delivery_type:'DELIVERY',address:'Rua A & B, 2',total:'TOTAL_PRIVATE',payment_method:'PAYMENT_PRIVATE',items:[{quantity:2,product:'Hambúrguer',price:'PRICE_PRIVATE',components:['Sem cebola']}]};
test('delivery summary preserves operational details without financial fields or phone',()=>{
 const text=deliverySummary(order);assert.match(text,/Entrega #99/);assert.match(text,/2 × Hambúrguer/);assert.match(text,/Sem cebola/);assert.match(text,/query=Rua%20A%20%26%20B%2C%202/);assert.doesNotMatch(text,/PRIVATE/);
});
test('pickup or missing address cannot produce a delivery message',()=>{
 assert.equal(deliverySummary({...order,delivery_type:'PICKUP'}),null);assert.equal(deliverySummary({...order,address:'  '}),null);assert.equal(deliverySummary({...order,address:null}),null);
});
