const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');

test('core RLS migration protects every operational table without browser policies',()=>{
 const sql=fs.readFileSync(path.join(__dirname,'../../database/rls-core-migration.sql'),'utf8');
 for(const table of ['products','conversations','orders','order_items','settings','user_profiles','whatsapp_inbox','whatsapp_messages'])assert.match(sql,new RegExp(`'${table}'`));
 assert.match(sql,/ENABLE ROW LEVEL SECURITY/i);
 assert.match(sql,/REVOKE ALL PRIVILEGES ON TABLE public\.%I FROM anon, authenticated/i);
 assert.doesNotMatch(sql,/CREATE\s+POLICY/i);
 assert.doesNotMatch(sql,/service_role[^\n]*(REVOKE|DENY)/i);
});

test('fresh schema enables RLS and revokes browser access by default',()=>{
 const sql=fs.readFileSync(path.join(__dirname,'../../database/schema.sql'),'utf8');
 for(const table of ['products','conversations','orders','order_items','settings'])assert.match(sql,new RegExp(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`,'i'));
 assert.match(sql,/FROM anon, authenticated/i);
});
