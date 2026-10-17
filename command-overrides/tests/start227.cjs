const {test}=require('node:test'),assert=require('node:assert/strict');
const {fixture}=require('./clock.cjs'),{open}=require('./startup.cjs');

test('228 offline: draft stays five; startup keeps five cards for every player without drawing extra cards',async t=>{
 const h=await open(t);h.run("enterLocalDebugMode();q('#setup').classList.remove('hidden')");h.click('#start');
 for(let i=0;i<20;i++)h.click('#cards .card');
 assert.deepEqual(h.read('hands.map(h=>h.length)'),[5,5,5,5]);
 const picked=h.read('hands.map(h=>h.map(c=>c.id))'),total=h.run('hands.flat().length+deck.length');
 h.run('beginTurn=()=>{}');
 for(let p=0;p<4;p++){for(let i=0;i<10;i++)h.click('#initialPowerSetup .turnstart-buttons button');h.click('#initialPowerSetup .row button.primary')}
 assert.deepEqual(h.read('hands.map(h=>h.length)'),[5,5,5,5]);
 assert.deepEqual(h.read('hands.map(h=>h.slice(0,5).map(c=>c.id))'),picked);
 assert.equal(h.run('hands.flat().length+deck.length+market.length'),total);
 assert.equal(h.run('new Set([...hands.flat(),...deck,...market].map(c=>c.id)).size'),total);
 h.run('resolveGameStartCharacterEffects()');assert.deepEqual(h.read('hands.map(h=>h.length)'),[5,5,5,5]);
});

test('228 default hand limit: UI and offline/online/Bot runtime agree on ten; custom limits still win',async t=>{
 const h=await open(t);
 assert.equal(h.run('gameSettings.handLimit'),10);assert.equal(h.dom.window.document.querySelector('#settingHandLimit').value,'10');
 h.run('applyRealOnlineRules()');assert.equal(h.run('gameSettings.handLimit'),10);
 h.run('enterBotMatch();syncOnlineDebugRulesFromUI()');assert.equal(h.run('gameSettings.handLimit'),10);
 h.run("q('#settingHandLimit').value=7;captureLocalRuleSettings()");assert.equal(h.run('gameSettings.handLimit'),7);
 h.run("q('#settingHandLimit').value='';captureLocalRuleSettings()");assert.equal(h.run('gameSettings.handLimit'),10);
});

test('228 ten-card limit: ten cards can end the turn; eleven require discard; warehouses remain additive',async t=>{
 const h=await fixture(t);h.run("gameSettings.handLimit=10;hands[0]=Array.from({length:10},(_,i)=>({id:'c'+i,type:'N',name:'test'}));completeEnd=()=>window.__ended=true;finishTurn()");
 assert.equal(h.run('window.__ended'),true);assert.equal(h.run('handLimitNeedsDiscard(0)'),false);
 h.run("window.__ended=false;hands[0].push({id:'extra',type:'N',name:'test'});finishTurn()");assert.equal(h.run('window.__ended'),false);assert.equal(h.run('handLimitNeedsDiscard(0)'),true);
 h.run("installed[0]=[{special:'warehouse'}];temporary[0]=[{special:'warehouse'}]");assert.equal(h.run('handLimit(0)'),14);assert.equal(h.run('handLimitNeedsDiscard(0)'),false);
});

test('228 shared lord resources: three independent choices total three, no fourth gain, reset each turn',async t=>{
 const h=await fixture(t);h.run("characters=Array(4).fill('P3');beginTurn();");
 assert.equal(h.run('pendingLordResource'),3);
 const text=h.dom.window.document.querySelector('#turnstarteffects').textContent;assert.match(text,/共通効果は合計3個/);assert.match(text,/残り3個/);
 h.run("gainLordResource('y');gainLordResource('p');gainLordResource('r');gainLordResource('y')");
 assert.equal(h.run('pendingLordResource'),0);assert.deepEqual(h.read('powers[0]'),{y:1,p:1,r:1});
 h.run('beginTurn()');assert.equal(h.run('pendingLordResource'),3);
});

test('228 lord-specific resource bonus remains additive exactly once and does not change employees',async t=>{
 const h=await fixture(t);h.run("renderGame=()=>{};characters[0]='P1';employees[0]=[applyUniqueAbilityDef({...CAST_TYPES.CUR1})];beginTurn()");
 assert.equal(h.run('pendingLordResource'),6);assert.deepEqual(h.read('pendingCastResourceChoices.map(x=>x.amount)'),[3]);
 h.run("for(let i=0;i<6;i++)gainLordResource('p')");assert.equal(h.run('powers[0].p'),6);
});

test('228 blocked shared resource choices cannot consume allowance or grant prohibited resources',async t=>{
 const h=await fixture(t);h.run("renderGame=()=>{};characters[0]='P3';beginTurn();installed[0]=[{type:'LEGEND',special:'goldenAge',_eraAcquiredThisTurn:true,specialConfig:{resourceGain:{ownerBlock:['y','p','r'],acquireTurnAllSources:true}}}];gainLordResource('y')");
 assert.equal(h.run('pendingLordResource'),3);assert.deepEqual(h.read('powers[0]'),{y:0,p:0,r:0});
});

test('228 Bot: a complete setup starts with five cards per player and resolves all three shared resource choices',async t=>{
 const h=await fixture(t);h.run("botMatchMode=true;onlineDebugMode=true;onlineDebugPlayers=['human','b1','b2','b3'];onlineCharSelections=['P3','P5','P7','P9'].map(charId=>({charId}));startOnlineDraft();queueBotTurn=()=>{};autoCompleteOnlineDebugSetup()");
 assert.deepEqual(h.read('hands.map(h=>h.length)'),[5,5,5,5]);assert.equal(h.run('pendingLordResource'),3);
 const initial=h.run('powers[0].y+powers[0].p+powers[0].r');h.run('botResolveStart()');assert.equal(h.run('pendingLordResource'),0);assert.equal(h.run('powers[0].y+powers[0].p+powers[0].r'),initial+3);
});

test('228 online snapshot: all initial cards and remaining common-resource choices survive serialization and resume',async t=>{
 const host=await fixture(t),guest=await fixture(t);
 for(const [i,h] of [host,guest].entries())h.run(`realOnlineMainMode=true;debugLocalMode=false;realLobbyPhase='main';realLobbyClientId='p${i}';realLobbyHostId='p0';viewer=${i};realMainRoster=[0,1,2,3].map(p=>({client_id:'p'+p,name:'P'+p,charId:'P3'}));realLobbyChannel={send:()=>Promise.resolve('ok')};turn=0;turnClockState.active=0;`);
 host.run('turnClockInitializeAuthority();turnClockNet.initial=false');
 host.run("renderGame=()=>{};characters=Array(4).fill('P3');hands=Array.from({length:4},(_,p)=>Array.from({length:5},(_,i)=>({id:'picked'+p+'-'+i,key:'S1',type:'S',name:'test'})));deck=Array.from({length:25},(_,i)=>({id:'new'+i,key:'N11',type:'N',name:'test'}));resolveGameStartCharacterEffects();beginTurn();gainLordResource('y')");
 const state=host.read('realMainSnapshot()');guest.run('applyRealMainSnapshot('+JSON.stringify(state)+')');
 assert.deepEqual(guest.read('hands.map(h=>h.map(c=>c.id))'),host.read('hands.map(h=>h.map(c=>c.id))'));
 assert.equal(guest.run('pendingLordResource'),2);assert.deepEqual(guest.read('powers'),host.read('powers'));
});
