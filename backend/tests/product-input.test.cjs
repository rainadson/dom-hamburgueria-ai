const {test}=require('node:test');const assert=require('node:assert/strict');
process.env.SUPABASE_URL='https://example.supabase.co';process.env.SUPABASE_SERVICE_ROLE_KEY='test';
const {productInput,ProductInputError}=require('../dist/products/product-input');
const {ProductService}=require('../dist/products/product.service');const {ProductRepository}=require('../dist/products/product.repository');
test('full UI payload preserves editable fields without rewriting identity or metadata',()=>{
 assert.deepEqual(productInput({id:1,created_at:'old',name:'Dom Tradicional',price:'8.99',category:null,description:'Ingredientes',active:false}),{name:'Dom Tradicional',price:8.99,category:null,description:'Ingredientes',active:false});
 assert.deepEqual(productInput({active:false},true),{active:false});assert.equal(productInput({name:'X',price:0}).price,0);
});
test('invalid prices, types and empty updates are rejected',()=>{
 for(const price of [-1,NaN,Infinity,null,{},true,'', '1,99',1.001,100000000])assert.throws(()=>productInput({name:'X',price}),ProductInputError);
 for(const input of [[],null,{}, {name:' ',price:1},{name:'X',price:1,active:'false'},{name:'X',price:1,category:[]}])assert.throws(()=>productInput(input),ProductInputError);
 assert.throws(()=>productInput({id:99},true),ProductInputError);
});
test('service validates before repository mutation',async()=>{
 const previous=ProductRepository.prototype.update;let calls=0;ProductRepository.prototype.update=async(id,payload)=>{calls++;return {id,...payload};};
 try{const service=new ProductService();await assert.rejects(service.updateProduct(1,{price:-5}),ProductInputError);await assert.rejects(service.updateProduct(-1,{active:true}),ProductInputError);assert.equal(calls,0);assert.deepEqual(await service.updateProduct(1,{id:90,active:false}),{id:1,active:false});}finally{ProductRepository.prototype.update=previous;}
});
