const {test}=require('node:test'),assert=require('node:assert/strict');
const {fixture}=require('./clock.cjs'),baseline=require('./fixtures/standard_221.json');
const state=`({powers,hands,breadHands,commandCounts,komePlace,dice,deck,discard,breadDeck,breadDiscard,installed,temporary,stdAbilityUsed,triggerNotices,pendingNanban,pendingTenkuCat})`;
const setup=`renderGame=()=>{};window.__alerts=[];alert=x=>window.__alerts.push(x);
 let __seed=12345;Math.random=()=>{__seed=(__seed*1664525+1013904223)>>>0;return __seed/4294967296};`;
async function pair(t){
 const current=await fixture(t),old=await fixture(t);
 for(const h of [current,old])h.run(setup);
 for(const [name,code] of Object.entries(baseline.legacyFunctions))old.run(name+'=('+code+')');
 return [current,old];
}
function same(pair,script){
 const outputs=pair.map(h=>h.run(script));
 assert.deepEqual(pair[0].read(state),pair[1].read(state));
 assert.deepEqual(pair[0].read('window.__alerts'),pair[1].read('window.__alerts'));
 if(typeof outputs[0]==='string'||typeof outputs[0]==='number')assert.equal(outputs[0],outputs[1]);
}
test('commands: pool directly reuses restrictions, source, owner and returns actual acquisition',async t=>{
 const h=await fixture(t);
 assert.equal(h.run("cardCommands.pool('y',3,{owner:2})"),3);
 assert.deepEqual(h.read('powers[2]'),{y:3,p:0,r:0});
 h.run("depressionStartSuppressed=true");assert.equal(h.run("cardCommands.pool('p',2)"),0);
 assert.equal(h.run("cardCommands.pool('p',2,{respectRestrictions:false})"),2);
 h.run("depressionStartSuppressed=false;eraGainAllowed=(p,k,s)=>s==='exchange'");
 assert.equal(h.run("cardCommands.pool('r',4)"),0);
 assert.equal(h.run("cardCommands.pool('r',4,{source:'exchange'})"),4);
 for(const script of ["cardCommands.pool('x',1)","cardCommands.pool('y',-1)","cardCommands.pool('y',1.5)"])
  assert.throws(()=>h.run(script),/resource|quantity/);
});
test('commands: deck/command draws use supply and recycling; deck draw is hand acquisition only',async t=>{
 const h=await fixture(t);h.run("discard=[{id:'a'},{id:'b'}];breadDiscard=[{id:'c',value:1},{id:'d',value:6}]");
 assert.equal(h.run("cardCommands.draw('deck',4,{owner:2}).count"),2);
 assert.equal(h.run("cardCommands.draw('command',4,{owner:1}).count"),2);
 assert.deepEqual(h.read('hands[2].map(c=>c.id).sort()'),['a','b']);
 assert.deepEqual(h.read('breadHands[1].map(c=>c.id).sort()'),['c','d']);
 assert.equal(h.run('installed.flat().length+temporary.flat().length'),0);
 assert.equal(h.run("cardCommands.draw('deck',0).count"),0);
 assert.throws(()=>h.run("cardCommands.draw('install',1)"),/target/);
});
test('commands: debt obeys stock, endgame and existing special prohibition',async t=>{
 const h=await fixture(t);h.run('komePlace=2');
 assert.deepEqual(h.read("cardCommands.draw('debt',5,{owner:3})"),{count:2,cards:[]});
 assert.deepEqual(h.read('commandCounts'),[0,0,0,2]);assert.equal(h.run('komePlace'),0);
 h.run('komePlace=10;endgameStarter=0');assert.equal(h.run("cardCommands.draw('debt',1).count"),0);
 h.run('endgameStarter=null;canAcquireDebt=()=>false');assert.equal(h.run("cardCommands.draw('debt',1).count"),0);
});
test('commands: all dice acquisitions and mutations preserve identity/usage and validate before mutation',async t=>{
 const h=await fixture(t);h.run("dice=[{id:8,value:2,used:true,source:'old'},{id:3,value:3,used:false,source:'old'}]");
 assert.deepEqual(h.read("cardCommands.dice('gain',{count:2,value:6,source:'card'}).map(d=>[d.id,d.value,d.used,d.source])"),[[9,6,false,'card'],[10,6,false,'card']]);
 assert.equal(h.run("cardCommands.dice('roll',{count:3}).every(d=>d.value>=1&&d.value<=6&&!d.used)"),true);
 assert.equal(h.run("cardCommands.dice('reroll',{dieId:8}).length"),0);
 assert.equal(h.run("cardCommands.dice('set',{dieId:99,value:1}).length"),0);
 h.run("cardCommands.dice('adjust',{dieId:3,delta:-5})");assert.equal(h.run('dice[1].value'),1);
 h.run("cardCommands.dice('adjust',{dieId:3,delta:8})");assert.equal(h.run('dice[1].value'),6);
 for(const operation of ['set','choose'])for(const value of [1,4,6]){
  h.run(`cardCommands.dice('${operation}',{dieId:3,value:${value}})`);
  assert.deepEqual(h.read('dice[1]'),{id:3,value,used:false,source:'old'});
 }
 assert.equal(h.run("cardCommands.dice('reroll',{dieId:3})[0]===dice[1]"),true);
 for(const script of ["cardCommands.dice('gain',{value:7})","cardCommands.dice('set',{dieId:3,value:0})","cardCommands.dice('adjust',{dieId:3,delta:0.5})","cardCommands.dice('roll',{count:-1})"]){
  const before=h.read('dice');assert.throws(()=>h.run(script));assert.deepEqual(h.read('dice'),before);
 }
});
test('commands: signed hand limit calculations have no stored state',async t=>{
 const h=await fixture(t);
 assert.equal(h.run("cardCommands.limit('hand',2,{count:3})"),12);
 assert.equal(h.run("cardCommands.limit('hand',-2,{base:12,count:2})"),8);
 assert.equal(h.run('gameSettings.handLimit'),6);
 assert.throws(()=>h.run("cardCommands.limit('other',2)"),/target/);
});
test('S1–S4 differential: all faces, operations, boundaries and two physical copies',async t=>{
 const p=await pair(t);
 for(let face=1;face<=6;face++)for(const [mode,delta] of [['plan',0],['adjust',-1],['adjust',1],['restrict',0],['permit',0]]){
  same(p,`dice=[{id:1,value:${face},used:false,source:'test'}];stdAbilityUsed={};useStdAbility('a','${mode}',1,${delta});useStdAbility('a','${mode}',1,${delta});useStdAbility('b','${mode}',1,${delta});`);
  assert.deepEqual(p[0].read('stdAbilityUsed'),{a:true,b:true});assert.equal(p[0].run('dice[0].used'),false);
 }
 same(p,"stdAbilityUsed={};dice=[{id:1,value:3,used:true}];useStdAbility('a','plan',1);useStdAbility('a','permit',99)");
 assert.deepEqual(p[0].read('stdAbilityUsed'),{});
});
test('S5–S10 differential: duplicates, boosts, empty/recycled supplies and start/repeat restrictions',async t=>{
 const p=await pair(t);
 for(const copies of [0,1,3])for(const boost of [false,true])for(const supply of ['full','recycle','empty'])for(const blocked of [false,true]){
  const init=`powers=Array.from({length:4},()=>({y:0,p:0,r:0}));hands=Array.from({length:4},()=>[]);breadHands=Array.from({length:4},()=>[]);triggerNotices=[];
   installed[0]=['mine','farm','barracks','commandroom','church'].flatMap(s=>Array.from({length:${copies}},(_,i)=>({id:s+i,name:s,special:s})));
   ${boost?"installed[0].push(...['legendmine','legendfarm','legendbarracks','legendmine'].map(s=>({special:s})))":''};
   let cards=Array.from({length:5},(_,i)=>({id:'c'+i,name:'card'+i})),orders=Array.from({length:5},(_,i)=>({id:'b'+i,value:i+1}));
   deck=${supply==='full'?'cards':'[]'};discard=${supply==='recycle'?'cards':'[]'};breadDeck=${supply==='full'?'orders':'[]'};breadDiscard=${supply==='recycle'?'orders':'[]'};
   eraGainAllowed=()=>${!blocked};depressionStartSuppressed=${blocked};`;
  for(const h of p)h.run(init);
  same(p,'resolveTurnStartEffects()');
  assert.deepEqual(p[0].read('powers[0]'),{y:copies*(boost?4:1),p:copies*(boost?4:1),r:copies*(boost?4:1)});
  for(const special of ['mine','farm','barracks','commandroom','church'])same(p,`repeatTurnStartEffect({special:'${special}'},2)`);
 }
});
test('S9 differential: stacking, temporary installation, removal and JSON restore recalculate limits',async t=>{
 const p=await pair(t);
 for(const script of ["installed[0]=[{id:'w1',special:'warehouse'},{id:'w2',special:'warehouse'}];temporary[0]=[{id:'w3',special:'warehouse'}]",'installed[0].shift()','temporary[0]=[]','installed=JSON.parse(JSON.stringify(installed))','installed[0]=[]']){
  same(p,script+';handLimit(0)');assert.equal(p[0].run('handLimit(1)'),6);
 }
});
test('S1 per-card activation is reset by normal next own turn',async t=>{
 const h=await fixture(t);h.run("renderGame=()=>{};dice=[{id:1,value:3,used:false}];useStdAbility('s1-a','plan',1);useStdAbility('s1-b','plan',1);beginTurn()");
 assert.deepEqual(h.read('stdAbilityUsed'),{});
});
test('Bot completes a regular turn with standard effects without waiting for timeout',async t=>{
 const h=await fixture(t);h.run("botMatchMode=true;onlineDebugMode=true;onlineDebugPlayers=['human','bot1','bot2','bot3'];turn=1;viewer=0;turnClockState.active=null;installed[1]=['mine','farm','barracks','warehouse'].map((special,i)=>({id:'std'+i,name:special,special,type:'STD'}));beginTurn()");
 const bot=h.run('botExecuteTurn()');
 for(let i=0;i<35&&h.run('turn')===1;i++){h.jump(1000);await h.flush()}
 await bot;assert.equal(h.run('turn'),2);assert.equal(h.run('gameEnded'),false);
});
