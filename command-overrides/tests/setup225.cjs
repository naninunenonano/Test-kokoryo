const {test}=require('node:test'),assert=require('node:assert/strict');
const {open}=require('./startup.cjs'),{fixture}=require('./clock.cjs');
const expected={winVP:30,marketTypes:12,initialResources:10,hireLimit:5,legendSlots:5};
const quiet="renderGame=()=>{};window.__alerts=[];alert=x=>window.__alerts.push(x);";
const supply="deck=Array.from({length:60},(_,i)=>({id:'c'+i,key:'K'+i,name:'c'+i,type:'N',vp:0}));";
async function setup(t){const h=await fixture(t);h.run(quiet+`Object.assign(gameSettings,${JSON.stringify(expected)});realOnlineRules={...realOnlineRules,...DEFAULT_RULE_SETTINGS};`);return h}
test('225 default fields and runtime values agree in offline, online and Bot setup',async t=>{
 const h=await open(t);assert.deepEqual(h.read('Object.fromEntries(Object.keys(DEFAULT_RULE_SETTINGS).map(k=>[k,gameSettings[k]]))'),expected);
 for(const prefix of ['setting','realRule','onlineDebugRule'])for(const [field,value]of Object.entries({WinVP:30,MarketTypes:12,InitialResources:10,HireLimit:5}))assert.equal(h.dom.window.document.getElementById(prefix+field).value,String(value));
 assert.equal(h.dom.window.document.querySelector('#settingLegendSlots').value,'5');
 h.run('enterBotMatch()');assert.equal(h.dom.window.document.querySelector('#onlineDebugRuleLegendSlots').value,'5');
 h.run("realOnlineRules={...realOnlineRules,...DEFAULT_RULE_SETTINGS};renderRealLobbyRules()");assert.equal(h.dom.window.document.querySelector('#realRuleLegendSlots').value,'5');
});
test('225 offline draft: 8 candidates, one per pass for five rounds, 5-card hands and 40-card conservation',async t=>{
 const h=await open(t);h.run("enterLocalDebugMode();q('#setup').classList.remove('hidden')");h.click('#start');
 assert.deepEqual(h.read('packs.map(p=>p.length)'),[8,8,8,8]);
 for(let r=0;r<5;r++)for(let p=0;p<4;p++){
  assert.equal(h.dom.window.document.querySelectorAll('#cards .card').length,8-r);h.click('#cards .card');
 }
 assert.deepEqual(h.read('hands.map(p=>p.length)'),[5,5,5,5]);assert.equal(h.read('new Set(hands.flat().map(c=>c.id)).size'),20);
 assert.equal(h.read('hands.flat().length+packs.flat().length+unusedStd.length'),40);
 h.run('beginTurn=()=>{}');for(let p=0;p<4;p++){for(let i=0;i<10;i++)h.click('#initialPowerSetup .turnstart-buttons button');h.click('#initialPowerSetup .row button.primary')}
 assert.deepEqual(h.read('powers.map(p=>p.y+p.p+p.r)'),[10,10,10,10]);assert.equal(h.read('new Set(market.map(c=>c.key)).size'),12);assert.equal(h.read("legends.filter(c=>c.tier==='lower').length"),5);assert.equal(h.read("legends.filter(c=>c.tier==='upper').length"),5);
});
test('225 custom offline values override defaults, including zero resources/hire limit and independent hand limit',async t=>{
 const h=await open(t);h.run("enterLocalDebugMode();for(const [id,v]of Object.entries({settingWinVP:41,settingMarketTypes:9,settingInitialResources:0,settingHireLimit:0,settingHandLimit:11,settingLegendSlots:2}))q('#'+id).value=v;q('#setup').classList.remove('hidden')");h.click('#start');
 assert.deepEqual(h.read('({winVP:gameSettings.winVP,marketTypes:gameSettings.marketTypes,initialResources:gameSettings.initialResources,hireLimit:gameSettings.hireLimit,legendSlots:gameSettings.legendSlots,handLimit:gameSettings.handLimit})'),{winVP:41,marketTypes:9,initialResources:0,hireLimit:0,legendSlots:2,handLimit:11});
 for(let i=0;i<20;i++)h.click('#cards .card');h.run('beginTurn=()=>{}');for(let p=0;p<4;p++)h.click('#initialPowerSetup .row button.primary');
 assert.deepEqual(h.read('powers.map(p=>p.y+p.p+p.r)'),[0,0,0,0]);assert.equal(h.read('new Set(market.map(c=>c.key)).size'),9);assert.equal(h.read('effectiveHireLimit()'),0);assert.equal(h.read('legends.length'),4);
});
test('225 setting change events run inside the game scope and retain user choices',async t=>{
 const h=await open(t);h.run("enterLocalDebugMode();q('#settingMarketTypes').value=17;q('#settingMarketTypes').dispatchEvent(new Event('change',{bubbles:true}))");assert.equal(h.read('gameSettings.marketTypes'),17);
 h.run("enterOnlineDebugLobby();q('#onlineDebugRuleInitialResources').value=0;q('#onlineDebugRuleInitialResources').dispatchEvent(new Event('change',{bubbles:true}));q('#onlineDebugRuleHireLimit').value=7;q('#onlineDebugRuleHireLimit').dispatchEvent(new Event('change',{bubbles:true}));syncOnlineDebugRulesFromUI()");assert.equal(h.read('gameSettings.initialResources'),0);assert.equal(h.read('gameSettings.hireLimit'),7);
});
test('225 refill and hire capacity obey standard and arbitrary settings without changing limits',async t=>{
 const h=await setup(t);h.run(supply+'refillMarket()');assert.equal(h.run('new Set(market.map(c=>c.key)).size'),12);h.run('market.splice(0,3);refillMarket()');assert.equal(h.run('new Set(market.map(c=>c.key)).size'),12);
 h.run('gameSettings.marketTypes=7;market=[];refillMarket()');assert.equal(h.run('new Set(market.map(c=>c.key)).size'),7);
 h.run('employees[0]=Array.from({length:4},()=>({}))');assert.equal(h.run("cardCommands.can(null,'hire-space')"),true);h.run('employees[0].push({})');assert.equal(h.run("cardCommands.can(null,'hire-space')"),false);h.run('gameSettings.hireLimit=8');assert.equal(h.run('effectiveHireLimit()'),8);
});
test('225 thirty VP threshold and custom threshold preserve the existing final-round order',async t=>{
 const h=await setup(t);h.run('debugVP=[29,0,0,0];checkEndgameTrigger()');assert.equal(h.run('endgameStarter'),null);h.run('debugVP[0]=30;checkEndgameTrigger()');assert.equal(h.run('endgameStarter'),0);assert.equal(h.run('endgameRemaining'),3);
 h.run('beginTurn=()=>turnClockBeginTurn();completeEnd()');assert.equal(h.run('gameEnded'),false);for(let p=0;p<2;p++)h.run('completeEnd()');assert.equal(h.run('gameEnded'),false);h.run('completeEnd()');assert.equal(h.run('gameEnded'),true);
 h.run('resetGameEndState();gameSettings.winVP=44;debugVP=[43,0,0,0];checkEndgameTrigger()');assert.equal(h.run('endgameStarter'),null);h.run('debugVP[turn]=44;checkEndgameTrigger()');assert.equal(h.run('endgameStarter'),h.run('turn'));
});
test('225 online debug draft and auto-setup use five rounds and ten initial resources',async t=>{
 const h=await setup(t);h.run("onlineDebugPlayers=['a','b','c','d'];onlineCharSelections=['P1','P3','P5','P7'].map(charId=>({charId}));startOnlineDraft()");assert.deepEqual(h.read('onlineDraftPacks.map(p=>p.length)'),[8,8,8,8]);
 for(let i=0;i<20;i++)h.run('onlineDraftPendingIndex=0;confirmOnlineDraftPick()');assert.deepEqual(h.read('onlineDraftHands.map(p=>p.length)'),[5,5,5,5]);assert.equal(h.run('onlineDraftRound'),4);
 h.run("startOnlineDraft();beginTurn=()=>{};autoCompleteOnlineDebugSetup()");assert.deepEqual(h.read('hands.map(p=>p.length)'),[5,5,5,5]);assert.deepEqual(h.read('powers.map(p=>p.y+p.p+p.r)'),[10,10,10,10]);assert.equal(h.run('new Set(market.map(c=>c.key)).size'),12);
});
test('225 Bot draft completes all five rounds and standard resource selection',async t=>{
 const h=await setup(t);h.run("botMatchMode=true;onlineDebugMode=true;onlineDebugPlayers=['human','b1','b2','b3'];onlineCharSelections=['P1','P3','P5','P7'].map(charId=>({charId}));startOnlineDraft()");
 for(let i=0;i<5;i++){h.run('onlineDraftPendingIndex=0;confirmOnlineDraftPick()');h.jump(1000);await h.flush()}
 assert.deepEqual(h.read('hands.map(p=>p.length)'),[5,5,5,5]);assert.equal(h.run('onlineDraftRound'),4);
 h.run("beginTurn=()=>{};queueBotTurn=()=>{};onlineResourceChoices[0]={y:10,p:0,r:0};onlineResourceActivePlayer=0;confirmOnlineResources();queueBotResources()");h.jump(1000);await h.flush();assert.deepEqual(h.read('powers.map(p=>p.y+p.p+p.r)'),[10,10,10,10]);
});
test('225 Bot resource setup also completes at custom totals 0, 1 and 7',async t=>{
 for(const total of [0,1,7]){
  const h=await setup(t);h.run(`botMatchMode=true;onlineDebugMode=true;onlineDebugPlayers=['h','b1','b2','b3'];onlineDraftHands=Array.from({length:4},()=>STD.slice(0,5));onlineDraftPacks=Array.from({length:4},()=>[]);unusedStd=[];q('#onlineDebugRuleInitialResources').value=${total};beginTurn=()=>{};queueBotTurn=()=>{};startOnlineResourceSelection();onlineResourceChoices[0]={y:${total},p:0,r:0};onlineResourceActivePlayer=0;confirmOnlineResources();queueBotResources()`);h.jump(1000);await h.flush();assert.deepEqual(h.read('powers.map(p=>p.y+p.p+p.r)'),Array(4).fill(total));assert.equal(h.run("q('#game').classList.contains('hidden')"),false);
 }
});
test('225 real-online rules preserve overrides and zero; four clients commit the same five-round draft',async t=>{
 const hs=await Promise.all(Array.from({length:4},()=>setup(t)));
 for(let i=0;i<4;i++)hs[i].run(`window.__roster=['P1','P3','P5','P7'].map((charId,p)=>({client_id:'p'+p,name:'p'+p,character:{charId}}));realLobbyPlayers=()=>window.__roster;realLobbyClientId='p${i}';isRealLobbyHost=()=>${i===0};saveRealOnlineResume=()=>{};`);
 hs[0].run('window.__draft=makeRealDraftInitialState()');const state=hs[0].read('window.__draft');for(const h of hs)h.run('applyRealDraftInit('+JSON.stringify(state)+')');
 for(let r=0;r<5;r++)for(let p=0;p<4;p++)for(const h of hs)h.run(`applyRealDraftPick({round:${r},playerIndex:${p},cardIndex:0})`);
 const result=hs[0].read('realDraftState');for(const h of hs){assert.deepEqual(h.read('realDraftState'),result);assert.deepEqual(h.read('realDraftState.hands.map(p=>p.length)'),[5,5,5,5]);assert.equal(h.run('realDraftState.round'),4)}
 hs[0].run('window.__resources=makeRealResourceInitialState()');const rs=hs[0].read('window.__resources');assert.deepEqual(rs.hands.map(p=>p.length),[5,5,5,5]);
 for(const h of hs){h.run('realResourceState='+JSON.stringify({...rs,choices:Array.from({length:4},()=>({y:4,p:3,r:3}))})+';beginTurn=()=>{};Math.random=()=>0.25;prepareRealMainGame()');assert.deepEqual(h.read('hands.map(p=>p.length)'),[5,5,5,5]);assert.deepEqual(h.read('powers.map(p=>p.y+p.p+p.r)'),[10,10,10,10]);assert.equal(h.run('new Set(market.map(c=>c.key)).size'),12);assert.equal(h.run('legends.length'),10);assert.equal(h.run('effectiveHireLimit()'),5)}
 for(const h of hs){h.run("realOnlineRules={...realOnlineRules,winVP:45,marketTypes:16,initialResources:0,hireLimit:0,legendSlots:2};applyRealOnlineRules();realResourceState.choices=Array.from({length:4},()=>({y:0,p:0,r:0}));prepareRealMainGame()");assert.deepEqual(h.read('Object.fromEntries(Object.keys(DEFAULT_RULE_SETTINGS).map(k=>[k,gameSettings[k]]))'),{winVP:45,marketTypes:16,initialResources:0,hireLimit:0,legendSlots:2});assert.equal(h.run('new Set(market.map(c=>c.key)).size'),16);assert.equal(h.run('legends.length'),4);assert.deepEqual(h.read('powers.map(p=>p.y+p.p+p.r)'),[0,0,0,0])}
});
test('225 six-player shortage is explicit; the same setup supports future stock increases without changing deck now',async t=>{
 const h=await setup(t);assert.equal(h.run('STD.length'),40);assert.equal(h.run('initialDraftSetupError(5)'), '');assert.match(h.run('initialDraftSetupError(6)'),/48.*40/);assert.throws(()=>h.run('createInitialDraftDeal(6)'),/不足/);
 h.run("window.__added=Array.from({length:8},(_,i)=>({...STD[i],id:'future'+i}));STD.push(...window.__added)");assert.deepEqual(h.read('createInitialDraftDeal(6).packs.map(p=>p.length)'),[8,8,8,8,8,8]);h.run('STD.splice(-8)');assert.equal(h.run('STD.length'),40);
});
