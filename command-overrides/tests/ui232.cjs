const {test}=require('node:test'),assert=require('node:assert/strict'),{fixture}=require('./clock.cjs');
const inventory='.turnstart-inventory',counts=(kind,face)=>`${inventory} [data-inventory-kind="${kind}"] [data-face="${face}"]`;
test('232 start inventory shows resources, distinct unused dice/ANY and orders without mutating state',async t=>{
 const h=await fixture(t);h.run(`powers[0]={y:12,p:5,r:0};dice=[{id:1,value:1,used:false},{id:2,value:1,used:true},{id:3,value:6,used:false},{id:4,value:'any',used:false}];breadHands[0]=[{value:2},{value:2},{value:6}];pendingLordResource=2;window.__before=JSON.stringify({powers,dice,breadHands,pendingLordResource});renderTurnStart()`);
 for(const [key,value]of [['y','資金 12'],['p','食料 5'],['r','兵力 0']])assert.equal(h.dom.window.document.querySelector(`${inventory} [data-resource="${key}"]`).textContent,value);
 for(const[k,f,n]of [['dice',1,1],['dice',2,0],['dice',6,1],['dice','any',1],['orders',2,2],['orders',6,1]])assert.equal(h.dom.window.document.querySelector(counts(k,f)).dataset.count,String(n));
 assert.equal(h.run('JSON.stringify({powers,dice,breadHands,pendingLordResource})===window.__before'),true);
});
test('232 real choice buttons update inventory across consecutive resource, SSR die and order changes',async t=>{
 const h=await fixture(t);h.run(`pendingLordResource=2;pendingSSRBonus=1;renderTurnStart()`);
 h.dom.window.document.querySelector('#turnstarteffects .turnstart-buttons button').click();assert.equal(h.dom.window.document.querySelector(`${inventory} [data-resource="y"]`).textContent,'資金 1');assert.equal(h.run('pendingLordResource'),1);
 h.run("gainSSRDie(4);breadHands[0].push({value:3});renderTurnStart()");assert.equal(h.dom.window.document.querySelector(counts('dice',4)).dataset.count,'1');assert.equal(h.dom.window.document.querySelector(counts('orders',3)).dataset.count,'1');
 h.run("dice[0].used=true;breadHands[0].pop();renderTurnStart()");assert.equal(h.dom.window.document.querySelector(counts('dice',4)).dataset.count,'0');assert.equal(h.dom.window.document.querySelector(counts('orders',3)).dataset.count,'0');
 h.dom.window.document.querySelector('#turnstarteffects .turnstart-buttons button').click();assert.equal(h.run('powers[0].y'),2);assert.equal(h.run("q('#turnstartpanel').classList.contains('hidden')"),true);
});
test('232 only start choices display inventory; no private orders in opponent view',async t=>{
 const h=await fixture(t);h.run('pendingLordResource=0;renderTurnStart()');assert.equal(h.dom.window.document.querySelector(inventory),null);
 h.run('onlineDebugMode=true;pendingLordResource=1;viewer=1;renderTurnStart()');assert.equal(h.dom.window.document.querySelector(inventory),null);
 h.run('viewer=0;pendingLordResource=0;pendingSSRBonus=1;renderTurnStart()');assert.ok(h.dom.window.document.querySelector(inventory));
});
