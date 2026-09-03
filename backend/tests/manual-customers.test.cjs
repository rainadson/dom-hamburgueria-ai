const {test}=require('node:test');const assert=require('node:assert/strict');
const {uniqueCustomers}=require('../dist/orders/manual-customers');
test('customer suggestions retain newest name, deduplicate formatted phones and expose no order values',()=>{
 const result=uniqueCustomers([{customer_name:' Atual ',customer_phone:'+351 912345678',total:999},{customer_name:'Antigo',customer_phone:'351912345678'},{customer_name:'Teste',customer_phone:'TEST-030926-A01'},{customer_name:null,customer_phone:'912345679'},{customer_name:'Sem telefone'}]);
 assert.deepEqual(result,[{name:'Atual',phone:'+351 912345678'},{name:'',phone:'912345679'}]);
});
