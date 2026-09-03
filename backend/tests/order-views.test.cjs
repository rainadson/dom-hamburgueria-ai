const {test}=require('node:test');const assert=require('node:assert/strict');
const {kitchenOrder,operationalOrder}=require('../dist/orders/order-view');
const raw={id:7,store_id:'PRIVATE_STORE',customer_name:'Cliente',customer_phone:'PRIVATE_PHONE',delivery_type:'DELIVERY',address:'Rua 1',payment_method:'PRIVATE_PAYMENT',amount_paid:50,change:30,total:20,delivery_fee:0,status:'PENDING',created_at:'2026-09-03T10:00:00Z',manual_actor_id:'PRIVATE_ACTOR',manual_payload_hash:'PRIVATE_HASH',items:[{id:1,product:'Dom',quantity:2,price:9,subtotal:18,components:['Sem cebola'],internal:'PRIVATE_ITEM'}]};
test('kitchen response contains preparation and delivery fields without personal finance',()=>{
 const view=kitchenOrder(raw),text=JSON.stringify(view);assert.equal(view.customer_name,'Cliente');assert.equal(view.address,'Rua 1');assert.deepEqual(view.items[0].components,['Sem cebola']);for(const secret of ['PRIVATE_STORE','PRIVATE_PHONE','PRIVATE_PAYMENT','PRIVATE_ACTOR','PRIVATE_HASH','PRIVATE_ITEM','subtotal','price','total','amount_paid','change'])assert.doesNotMatch(text,new RegExp(secret));
});
test('operational order keeps required customer and payment summary but removes internal fields',()=>{
 const view=operationalOrder(raw),text=JSON.stringify(view);assert.equal(view.customer_phone,'PRIVATE_PHONE');assert.equal(view.total,20);assert.equal(view.payment_method,'PRIVATE_PAYMENT');assert.equal(view.items[0].subtotal,18);for(const secret of ['PRIVATE_STORE','PRIVATE_ACTOR','PRIVATE_HASH','PRIVATE_ITEM','amount_paid','change','manual_'])assert.doesNotMatch(text,new RegExp(secret));
});
