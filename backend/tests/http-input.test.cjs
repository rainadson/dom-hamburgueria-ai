const {test}=require('node:test');const assert=require('node:assert/strict');
const {positiveId,queryPage,querySearch}=require('../dist/middlewares/http-input');
test('HTTP identifiers accept only canonical positive safe integers',()=>{
 assert.equal(positiveId('1'),1);assert.equal(positiveId('9007199254740991'),9007199254740991);
 for(const value of [undefined,null,1,'','0','01','-1','1e2','1.0',' 1','9007199254740992'])assert.equal(positiveId(value),null,String(value));
});
test('conversation query parameters reject arrays, objects, overflow and filter syntax',()=>{
 assert.equal(queryPage(undefined),0);assert.equal(queryPage('0'),0);assert.equal(queryPage('12'),12);
 for(const value of [['1'],{},'-1','1e2','9007199254740992'])assert.equal(queryPage(value),null);
 assert.equal(querySearch(undefined),'');assert.equal(querySearch('  João +351  '),'João +351');
 for(const value of [['nome'],{},'x'.repeat(101),'nome,order_draft.eq.secret','nome%'])assert.equal(querySearch(value),null);
});
