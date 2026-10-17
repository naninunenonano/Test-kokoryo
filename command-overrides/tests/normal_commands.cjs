const {test}=require('node:test'),assert=require('node:assert/strict');
const {fixture}=require('./clock.cjs'),baseline=require('./fixtures/normal_222.json');
const state=`({powers,hands,breadHands,commandCounts,komePlace,dice,deck,discard,breadDeck,breadDiscard,installed,temporary,stdAbilityUsed,graveyardUsed,publicMarketUsed,triggerNotices,pendingParkPlayers,pendingParkTaken,dialogLog,hiredThisTurn,employees})`;
const setup=`renderGame=()=>{};window.__alerts=[];alert=x=>window.__alerts.push(x);let __seed=1234;Math.random=()=>{__seed=(1664525*__seed+1013904223)>>>0;return __seed/4294967296};
 window.__pick=null;chooseLegendCard=(title,note,opts,choose,cancel)=>{window.__pick={opts,choose,cancel}};
 gameSettings.marketTypes=3;dialogLog=[];`;
async function pair(t){const hs=[await fixture(t),await fixture(t)];for(const h of hs)h.run(setup);for(const[name,code]of Object.entries(baseline.legacyFunctions))if(name!=='commandDice')hs[1].run(name+'=('+code+')');return hs}
function same(hs,script){hs.forEach(h=>h.run(script));assert.deepEqual(hs[0].read(state),hs[1].read(state));assert.deepEqual(hs[0].read('window.__alerts'),hs[1].read('window.__alerts'))}
function supply(){return `deck=Array.from({length:30},(_,i)=>({key:'K'+i,id:'k'+i,name:'card'+i,type:'N'}));breadDeck=Array.from({length:12},(_,i)=>({id:'b'+i,value:i%6+1}));`}
test('direct choice/move/can/count: explicit zones, selection only, snapshot counts, atomic invalid move',async t=>{
 const h=await fixture(t);h.run(setup+`hands[0]=[{id:'a',type:'N'},{id:'b',type:'S'}];temporary[0]=[{id:'c'}];`);
 h.run("window.__chosen=cardCommands.choice('hand',1,{select:[1]});window.__n=cardCommands.count('hand',()=>true)");
 assert.deepEqual(h.read('window.__chosen.map(c=>c.id)'),['b']);assert.equal(h.run('hands[0].length'),2);
 h.run("cardCommands.move(window.__chosen,'hand','discard')");assert.equal(h.run('window.__n'),2);assert.equal(h.run('hands[0].length'),1);
 assert.equal(h.run("cardCommands.can(temporary[0][0],'installed')"),false);assert.equal(h.run("cardCommands.can(temporary[0][0],'temporary')"),true);
 const old=h.read(state);assert.throws(()=>h.run("cardCommands.move(temporary[0][0],'installed','discard')"),/explicit source/);assert.deepEqual(h.read(state),old);
 for(const script of ["cardCommands.choice('hand',1,{select:[4]})","cardCommands.choice('hand',2,{select:[0,0]})","cardCommands.can(null,'bogus')","cardCommands.count('missing')"]){assert.throws(()=>h.run(script));assert.deepEqual(h.read(state),old)}
});
test('direct start: wrapping order and serial wait/commit without skipping another player',async t=>{
 const h=await fixture(t);assert.deepEqual(h.read("cardCommands.start(2,'all')"),[2,3,0,1]);
 h.run("window.__queue=cardCommands.start(3,3);window.__seen=[]");
 assert.equal(h.run("cardCommands.start(0,1,{queue:window.__queue,step:p=>window.__seen.push(p)})"),false);
 assert.equal(h.run("cardCommands.start(3,1,{queue:window.__queue,step:()=>false})"),false);
 assert.deepEqual(h.read('window.__queue'),[3,0,1]);assert.deepEqual(h.read('window.__seen'),[]);
 h.run("cardCommands.start(3,1,{queue:window.__queue,step:p=>{window.__seen.push(p);return true}})");
 assert.deepEqual(h.read('window.__queue'),[0,1]);assert.deepEqual(h.read('window.__seen'),[3]);
});
test('direct change/plus: distinct-type target, recycling, no limit changes',async t=>{
 const h=await fixture(t);h.run(setup+`market=[{id:'a',key:'a'},{id:'a2',key:'a'}];deck=[{id:'b',key:'b'},{id:'b2',key:'b'},{id:'c',key:'c'}];`);
 h.run("cardCommands.plus('market')");assert.equal(h.run('new Set(market.map(c=>c.key)).size'),3);assert.equal(h.run('gameSettings.marketTypes'),3);
 h.run("cardCommands.change('market','all')");assert.equal(h.run('market.length+deck.length+discard.length'),5);assert.equal(h.run('gameSettings.marketTypes'),3);
 assert.throws(()=>h.run("cardCommands.plus('hand')"),/target/);
});
test('direct trigger: matching events/actors/items/instances and pure conditions, no permanent listeners',async t=>{
 const h=await fixture(t);h.run(`window.__fired=[];window.__rule={event:'dice-acquired',targets:[0,1,2],when:p=>p!==0,instances:p=>p,match:d=>d.value===3,effect:e=>window.__fired.push([e.owner,e.occurrences])}`);
 h.run("cardCommands.trigger('set',{items:[{value:3}]},window.__rule)");assert.deepEqual(h.read('window.__fired'),[]);
 h.run("cardCommands.trigger('dice-acquired',{items:[{value:3},{value:1},{value:3}]},window.__rule)");assert.deepEqual(h.read('window.__fired'),[[1,1],[1,1],[2,1],[2,1],[2,1],[2,1]]);
});
test('direct hire/toba: gacha and installation hooks reused, independent of card IDs',async t=>{
 const h=await fixture(t);h.run(setup+`gachaCast=()=>({id:'e',name:'worker',rarity:'N'});window.__accepted=[];`);
 assert.equal(h.run("cardCommands.hire('gacha',2,{accept:e=>window.__accepted.push(e)}).length"),2);assert.equal(h.run('window.__accepted.length'),2);
 h.run("deck=[{id:'other',special:'lordmeeting'}];breadDeck=[{id:'b1',value:1}];cardCommands.toba({owner:2})");
 assert.equal(h.run('temporary[2][0].id'),'other');assert.equal(h.run('breadHands[2].length'),1);assert.equal(h.run('hands[2].length'),0);
});
test('direct once: individual cards, read/consume split, 2 per turn and game-owned ledger',async t=>{
 const h=await fixture(t);h.run('window.__turnUsage={};window.__gameUsage={};');
 for(const period of ['turn','game']){
  const usage=period==='turn'?'window.__turnUsage':'window.__gameUsage';
  for(let i=0;i<2;i++)assert.equal(h.run(`cardCommands.once(2,'${period}',{cardId:'a',usage:${usage},consume:true})`),true);
  assert.equal(h.run(`cardCommands.once(2,'${period}',{cardId:'a',usage:${usage},consume:true})`),false);
  assert.equal(h.run(`cardCommands.once(2,'${period}',{cardId:'b',usage:${usage}})`),true);
 }
 h.run('window.__turnUsage={}');assert.equal(h.run("cardCommands.once(2,'game',{cardId:'a',usage:window.__gameUsage})"),false);
});
test('N1 differential: public reset, all owner orders, grouped picks, no refill between players, empty deck',async t=>{
 const hs=await pair(t);
 for(const owner of [0,1,3]){
  same(hs,`${supply()}market=[{key:'old',id:'old',name:'old'}];discard=[];hands=Array.from({length:4},()=>[]);turn=${owner};resolveOnInstall({special:'paneteria'},${owner});`);
  for(let n=0;n<4;n++)same(hs,"if(market.length)applyOnlineParkPick(pendingParkPlayers[0],market[0].key);else finishEmptyParkChoices()");
  assert.equal(hs[0].run('pendingParkPlayers.length'),0);
 }
 same(hs,"deck=[];discard=[];market=[];resolveOnInstall({special:'paneteria'},0);finishEmptyParkChoices()");
});
test('N2 differential: quotas, owner wrap, supply exhaustion and no duplicate physical orders',async t=>{
 const hs=await pair(t);
 for(const owner of [0,2,3])for(const n of [0,1,2,3,4,6,10])same(hs,`breadHands=Array.from({length:4},()=>[]);breadDiscard=[];breadDeck=Array.from({length:${n}},(_,i)=>({id:'b'+i,value:1}));resolveLordMeetingInstall(${owner})`);
});
test('N3 differential: recycling, chained installations and installation reactions',async t=>{
 const hs=await pair(t);
 for(const nested of [false,true])same(hs,`deck=[${nested?"{id:'nested',name:'nested',special:'blackcasino'},":''}{id:'drawn',name:'drawn',special:'lordmeeting'}];breadDeck=[{id:'b',value:1}];discard=[];installed[1]=[{id:'tax',special:'landgrab'}];resolveOnInstall({special:'blackcasino'},0)`);
 same(hs,"deck=[];discard=[{id:'recycled',name:'recycled'}];resolveOnInstall({special:'blackcasino'},0)");
 same(hs,"deck=[];discard=[];resolveOnInstall({special:'blackcasino'},0)");
});
test('N4–N7 differential: normal/upgraded installations, temporary bases rejected, costs unchanged',async t=>{
 const hs=await pair(t);
 for(const [special,base,a,b]of [['greatermine','mine',1,2],['greaterfarm','farm',3,4],['greaterbarracks','barracks',5,6],['greatercommand','commandroom',3,4]])for(const mode of ['normal','up:0','temporary','resource-fail','dice-fail']){
  const init=`powers[0]={y:20,p:20,r:20};hands[0]=[{id:'up',name:'up',special:'${special}'}];installed[0]=[{id:'base',name:'base',special:'${base}'}];temporary[0]=[];dice=[{id:1,value:${a},used:false},{id:2,value:${b},used:false}];`;
  same(hs,init+(mode==='temporary'?"temporary[0]=installed[0];installed[0]=[];":mode==='resource-fail'?"powers[0]={y:0,p:0,r:0};":mode==='dice-fail'?"dice=[];":'')+`installGreaterAcquisition(0,'${special}','d:1','d:2','${mode==='temporary'?'up:0':mode.startsWith('up')?mode:'normal'}')`);
 }
});
test('N4–N7/N13 differential: turn-start duplicates, restrictions, resource thresholds, repeat effects',async t=>{
 const hs=await pair(t);
 for(const count of [0,1,3])for(const blocked of [true,false]){
  same(hs,`${supply()}powers=[{y:0,p:0,r:0},{y:4,p:0,r:0},{y:5,p:0,r:0},{y:2,p:2,r:1}];installed=Array.from({length:4},()=>[]);installed[0]=['greatermine','greaterfarm','greaterbarracks','greatercommand','bandit'].flatMap(s=>Array.from({length:${count}},(_,i)=>({id:s+i,special:s})));eraGainAllowed=()=>${!blocked};resolveTurnStartEffects()`);
  for(const special of ['greatermine','greaterfarm','greaterbarracks','greatercommand','bandit'])same(hs,`repeatTurnStartEffect({special:'${special}'},2)`);
 }
});
test('N8–N10 differential: five matching dice × duplicate instances, every face and 2–6 players',async t=>{
 const hs=await pair(t);
 for(const count of [2,3,4,6])for(const face of [1,3,6])for(const stock of [0,3,100])same(hs,`playerCount=${count};temporary=Array.from({length:${count}},()=>[]);employees=Array.from({length:${count}},()=>[]);characters=Array(${count}).fill('P1');powers=Array.from({length:${count}},()=>({y:0,p:0,r:0}));installed=Array.from({length:${count}},(_,p)=>p===0?[]:['laws','famine','swordhunt'].flatMap(s=>[0,1].map(i=>({id:s+i,special:s}))));commandCounts=Array(${count}).fill(0);komePlace=${stock};dice=Array.from({length:5},(_,i)=>({id:i+1,value:${face},used:false}));resolveReactiveRolls()`);
});
test('N8–N10: S1 reroll emits only its one die, set/adjust/consume do not emit; S copies remain independent',async t=>{
 const h=await fixture(t);h.run(setup+`Math.random=()=>0;installed[1]=[{id:'l1',special:'laws'},{id:'l2',special:'laws'}];dice=[{id:1,value:1,used:false},{id:2,value:1,used:false}];triggerNotices=['previous'];useStdAbility('s1-a','plan',1)`);
 assert.equal(h.run('commandCounts[0]'),2);assert.equal(h.run('powers[1].y'),2);assert.equal(h.run('triggerNotices[0]'),'previous');
 h.run("useStdAbility('s1-a','plan',1);useStdAbility('s1-b','plan',2)");assert.equal(h.run('commandCounts[0]'),4);
 h.run("useStdAbility('s2','adjust',1,1);useStdAbility('s3','restrict',1);useStdAbility('s4','permit',2);useDie(1)");assert.equal(h.run('commandCounts[0]'),4);
 assert.deepEqual(h.read('stdAbilityUsed'),{'s1-a':true,'s1-b':true,s2:true,s3:true,s4:true});
});
test('N11 differential: selection and costs, cancel and stale callback, per-card once, reordering',async t=>{
 const hs=await pair(t);
 same(hs,"installed[0]=[{id:'g1',special:'graveyard'},{id:'g2',special:'graveyard'}];discard=[{id:'x',name:'x'},{id:'y',name:'y'}];powers[0]={y:2,p:0,r:0};graveyardUsed=[];useGraveyard(0)");
 hs.forEach(h=>h.run('window.__pick.cancel()'));assert.deepEqual(hs[0].read('graveyardUsed'),[]);
 same(hs,"useGraveyard(0);window.__pick.choose(window.__pick.opts[0]);q('#legendChoiceCards').children[0].click()");
 same(hs,"q('#legendChoiceCards').children[0].click();installed[0].reverse();useGraveyard(1)");
 same(hs,"useGraveyard(0);window.__pick.choose(window.__pick.opts[0]);q('#legendChoiceCards').children[0].click()");
 assert.deepEqual(hs[0].read('graveyardUsed[0]'),{g1:true,g2:true});
});
test('N12 differential: other-player install, duplicates, temporary excluded and game prohibition',async t=>{
 const hs=await pair(t);
 for(const owner of [0,1])for(const blocked of [true,false])same(hs,`installed[0]=[{special:'landgrab'},{special:'landgrab'}];installed[1]=[{special:'landgrab'}];temporary[2]=[{special:'landgrab'}];eraGainAllowed=()=>${!blocked};triggerLandGrab(${owner})`);
});
test('N14 differential: grouped take, discard acquired card, cancellation, refill, separate once',async t=>{
 const hs=await pair(t);
 for(const answers of [['1','1'],['1','2'],[null],['1',null],['9'],['1','99']]){
  same(hs,`${supply()}installed[0]=[{id:'m1',special:'publicmarket'},{id:'m2',special:'publicmarket'}];publicMarketUsed=[];powers[0]={y:10,p:0,r:0};hands[0]=[{id:'h',name:'hand'}];market=[{id:'a',key:'A',name:'A'},{id:'a2',key:'A',name:'A'},{id:'b',key:'B',name:'B'}];window.__answers=${JSON.stringify(answers)};turnClockPrompt=()=>window.__answers.shift()??null;usePublicMarket(0)`);
 }
 same(hs,"window.__answers=['1','1'];usePublicMarket(0);window.__answers=['1','1'];usePublicMarket(1)");
 assert.deepEqual(hs[0].read('publicMarketUsed[0]'),{m1:true,m2:true});
});
test('N15 differential: temporary unusable, installed discard, empty/full pool, unique redraw and hireBread',async t=>{
 const hs=await pair(t);
 for(const mode of ['normal','temporary','full','empty','redraw']){
  same(hs,`installed[0]=[{id:'s',special:'scout'}];temporary[0]=[];employees[0]=[];hiredThisTurn=false;breadDeck=[{id:'b',value:1}];gachaCast=()=>${mode==='empty'?'null':"({id:'CNX',rarity:'N',name:'worker',hireBread:1})"};sameUniqueAbilityAsLord=()=>${mode==='redraw'};implementedCastPool=()=>[{}];turnClockConfirm=()=>true;redrawSameRarityCast=()=>({id:'redraw',rarity:'N',name:'redrawn'});`+(mode==='temporary'?"temporary[0]=installed[0];installed[0]=[];":mode==='full'?"employees[0]=Array(3).fill({});":'')+'useScout(0)');
 }
});
test('N15 differential: install costs and capacity gates unchanged, successful install remains temporary',async t=>{
 const hs=await pair(t);
 for(const full of [false,true])for(const poor of [false,true])same(hs,`hands[0]=[{id:'scout',special:'scout'}];installed[0]=[];temporary[0]=[];employees[0]=Array(${full?3:0}).fill({});powers[0]=${poor?'{y:1,p:2,r:2}':'{y:2,p:2,r:2}'};installNewNormal(0,[])`);
});
test('Bot: a full turn with N start effects, reactive opponents and Scout completes normally',async t=>{
 const h=await fixture(t);h.run("botMatchMode=true;onlineDebugMode=true;onlineDebugPlayers=['human','bot1','bot2','bot3'];turn=1;viewer=0;turnClockState.active=null;breadDeck=Array.from({length:8},(_,i)=>({id:'b'+i,value:i%6+1}));installed[1]=['greatermine','greaterfarm','greaterbarracks','greatercommand','bandit','scout'].map((special,i)=>({id:'n'+i,name:special,special,type:'N',vp:0}));installed[0]=['laws','famine','swordhunt'].map(special=>({id:special,special,name:special}));powers[0]={y:5,p:0,r:0};beginTurn()");
 const bot=h.run('botExecuteTurn()');for(let i=0;i<50&&h.run('turn')===1;i++){h.jump(1000);await h.flush()}await bot;
 assert.equal(h.run('turn'),2);assert.equal(h.run('gameEnded'),false);assert.equal(h.run("installed[1].some(c=>c.special==='scout')"),false);assert.equal(h.run('employees[1].length'),1);
});
