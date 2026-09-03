const {test}=require('node:test');const assert=require('node:assert/strict');
process.env.SUPABASE_URL='https://example.supabase.co';process.env.SUPABASE_SERVICE_ROLE_KEY='test';
const STORE_A='11111111-1111-4111-8111-111111111111',STORE_B='22222222-2222-4222-8222-222222222222';
const {supabase}=require('../dist/database/supabase');const {ProductRepository}=require('../dist/products/product.repository');const {OrderRepository}=require('../dist/orders/order.repository');const {ConversationRepository}=require('../dist/conversation/conversation.repository');

test('repositories scope reads and writes to their own store',async()=>{
 const original=supabase.from;const calls=[];
 supabase.from=table=>{const filters=[];const q={select(){return q},eq(k,v){filters.push([k,v]);return q},order(){calls.push({table,filters:[...filters]});return Promise.resolve({data:[],error:null})},insert(value){calls.push({table,value});return q},single:async()=>({data:{},error:null})};return q};
 try{await new ProductRepository(STORE_A).findAllAdmin();await new OrderRepository(STORE_B).findAll();await new ConversationRepository(STORE_A).create('351000000000');
  assert.deepEqual(calls[0].filters,[['store_id',STORE_A]]);assert.deepEqual(calls[1].filters,[['store_id',STORE_B]]);assert.equal(calls[2].value.store_id,STORE_A);
 }finally{supabase.from=original;}
});

test('multistore migration backfills the current store and removes global phone uniqueness',()=>{
 const fs=require('node:fs'),path=require('node:path');const sql=fs.readFileSync(path.join(__dirname,'../../database/multistore-migration.sql'),'utf8');
 assert.match(sql,/CREATE TABLE IF NOT EXISTS public\.stores/i);assert.match(sql,/UPDATE public\.%I SET store_id=\$1 WHERE store_id IS NULL/i);assert.match(sql,/ALTER COLUMN store_id SET NOT NULL/i);assert.match(sql,/conversations_store_phone_unique/i);assert.match(sql,/REVOKE ALL PRIVILEGES ON TABLE public\.stores FROM anon, authenticated/i);
});
