const {test}=require('node:test');
const assert=require('node:assert/strict');
const {JSDOM,requestInterceptor,VirtualConsole}=require('jsdom');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../_site');
const bridge=`
window.__clockTest={run:code=>eval(code),tick:testClockTick,expire:testClockExpire};
`;
async function fixture(t,options={}){
 let now=0,id=0;const jobs=new Map(),errors=[];
 let html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace('\n})();\nconst q=s=>document.querySelector(s);',bridge+'\n})();\nconst q=s=>document.querySelector(s);');
 if(options.futureBaseThree)html=html.replaceAll('1+bonus','3+bonus');
 const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(html,{
  url:'https://naninunenonano.github.io/Test-kokoryo/',runScripts:'dangerously',virtualConsole:vc,
  resources:{interceptors:[requestInterceptor(req=>new Response(fs.readFileSync(path.join(root,new URL(req.url).pathname.replace('/Test-kokoryo/',''))),{headers:{'Content-Type':'application/javascript'}}))]},
  beforeParse(w){
   w.Date.now=()=>now;Object.defineProperty(w.performance,'now',{value:()=>now});
   w.setTimeout=(fn,ms=0)=>{jobs.set(++id,{fn,at:now+ms});return id};w.clearTimeout=n=>jobs.delete(n);
   w.setInterval=()=>++id;w.clearInterval=()=>{};
   w.alert=m=>errors.push('alert: '+m);w.confirm=()=>false;w.prompt=()=>null;w.structuredClone=structuredClone;
   w.fetch=()=>{throw Error('unexpected network')};w.WebSocket=class{constructor(){throw Error('unexpected socket')}};
  }
 });
 await new Promise(resolve=>dom.window.addEventListener('load',resolve,{once:true}));
 const h=dom.window.__clockTest;assert.ok(h,'TEST clock bridge');
 const run=code=>h.run(code),read=code=>JSON.parse(run('JSON.stringify('+code+')'));
 run(`
 debugLocalMode=true;onlineDebugMode=false;botMatchMode=false;realOnlineMainMode=false;playerCount=4;
 characters=Array(4).fill('P1');hands=Array.from({length:4},()=>[]);breadHands=Array.from({length:4},()=>[]);
 installed=Array.from({length:4},()=>[]);temporary=Array.from({length:4},()=>[]);employees=Array.from({length:4},()=>[]);
 powers=Array.from({length:4},()=>({y:0,p:0,r:0}));commandCounts=Array(4).fill(0);dice=[];deck=[];market=[];discard=[];
 breadDeck=[];breadDiscard=[];legends=[];nightEscapeResetNext=[];lordFirstBreadUsed=[];lordOverclockUsed=[];
 lordOracleUsed=[];lordTributeUsed=[];elekiterUsed=[];debugVP=Array(4).fill(0);graveyardUsed=[];publicMarketUsed=[];
 triggerNotices=[];pendingParkPlayers=[];pendingParkTaken=[];pendingOverclockChoices=[];pendingCastResourceChoices=[];
 pendingLordResource=0;pendingNanban=0;pendingTenkuCat=0;pendingSSRBonus=0;turnStartPostPending=false;
 turn=0;viewer=0;endgameStarter=null;endgameRemaining=0;gameEnded=false;komePlace=100;gameSettings.handLimit=6;
 q('#game').classList.remove('hidden');q('#entryScreen').classList.add('hidden');q('#mainApp').classList.remove('entry-locked');
 testClockReset();testClockBeginTurn();
 `);
 t.after(()=>{dom.window.close();assert.deepEqual(errors,[])});
 return {run,read,dom,errors,advance(ms){now+=ms;h.tick()},jump(ms){now+=ms},tick:h.tick,
  async flush(){for(const [key,j] of [...jobs])if(j.at<=now){jobs.delete(key);j.fn()}for(let i=0;i<10;i++)await Promise.resolve()},
  delays(){return [...jobs.values()].map(j=>j.at-now)},
  async expire(){const token=read('testClockState.token');run('testClockState.remaining[turn]=0');h.expire(token);await Promise.resolve();return token}};
}
test('180 seconds each; only active player spends elapsed time',async t=>{
 const h=await fixture(t);h.advance(50000);
 assert.deepEqual(h.read('testClockState.remaining'),[130000,180000,180000,180000]);
 assert.equal(h.dom.window.document.querySelector('[data-clock-player="0"]').dataset.seconds,'130');
});
test('170 seconds plus recovery caps at 180 seconds',async t=>{
 const h=await fixture(t);h.advance(10000);h.run('completeEnd()');assert.equal(h.read('testClockState.remaining[0]'),180000);
});
test('normal completion recovers 30 seconds, caps at 180, preserves carryover',async t=>{
 const h=await fixture(t);h.advance(50000);h.run('completeEnd()');
 assert.equal(h.read('testClockState.remaining[0]'),160000);
 for(let i=0;i<3;i++)h.run('completeEnd()');
 assert.equal(h.read('turn'),0);h.advance(70000);h.run('completeEnd()');
 assert.equal(h.read('testClockState.remaining[0]'),120000);
 assert.equal(h.read('testClockState.remaining[1]'),180000);
});
test('timeout uses ordinary conversion for all six faces, ignores used dice and orders',async t=>{
 const h=await fixture(t);h.run("dice=[1,2,3,4,5,6].map((value,i)=>({id:i+1,value,used:false}));dice.push({id:7,value:1,used:true});breadHands[0]=[{id:'b',value:6}]");
 await h.expire();assert.deepEqual(h.read('powers[0]'),{y:2,p:2,r:2});
 assert.equal(h.read('breadHands[0].length'),1);assert.equal(h.read('testClockState.remaining[0]'),30000);assert.equal(h.read('turn'),1);
});
test('manual and timeout conversions share employee and copied-ability bonuses',async t=>{
 const h=await fixture(t);h.run("employees[0]=[{dieResourceBonus:1}];copiedAbility='神の恩恵';dice=[{id:1,value:1,used:false},{id:2,value:1,used:false}];renderConversionActions();q('#normalconvertchoices button').click()");
 assert.equal(h.read('powers[0].y'),3);await h.expire();assert.equal(h.read('powers[0].y'),6);
});
test('a future ordinary base amount change reaches both manual and timeout conversion',async t=>{
 const h=await fixture(t,{futureBaseThree:true});h.run("dice=[{id:1,value:1,used:false},{id:2,value:1,used:false}];renderConversionActions();q('#normalconvertchoices button').click()");
 assert.equal(h.read('powers[0].y'),3);await h.expire();assert.equal(h.read('powers[0].y'),6);
});
test('timeout and repeated stale expiration finalize temporary cards and advance exactly once',async t=>{
 const h=await fixture(t);h.run("temporary[0]=[{id:'placed',key:'N1',type:'N',name:'test',vp:0}]");
 const old=await h.expire();h.run(`testClockExpire(${old});testClockExpire(${old})`);h.tick();
 assert.equal(h.read('turn'),1);assert.equal(h.read('installed[0].length'),1);assert.equal(h.read('temporary[0].length'),0);
 assert.equal(h.read('testClockState.remaining[0]'),30000);
});
test('uniform overflow pool includes normal cards and command sheets, not debt',async t=>{
 const h=await fixture(t);h.run(`gameSettings.handLimit=10;commandCounts[0]=5;hands[0]=Array.from({length:4},(_,i)=>({id:'n'+i}));breadHands[0]=[1,2,3].map(value=>({id:'b'+value,value}));Math.random=()=>0.999;`);
 await h.expire();assert.equal(h.read('commandCounts[0]'),5);assert.equal(h.read('hands[0].length'),4);
 assert.equal(h.read('breadHands[0].length'),1);assert.equal(h.read('totalHandCount(0)'),10);
});
test('overflow discards ordinary cards too and respects warehouse capacity',async t=>{
 const h=await fixture(t);h.run(`hands[0]=Array.from({length:10},(_,i)=>({id:'n'+i}));temporary[0]=[{id:'w',type:'S',special:'warehouse'}];Math.random=()=>0;`);
 await h.expire();assert.equal(h.read('hands[0].length'),8);assert.equal(h.read('market.length+discard.length+deck.length'),2);assert.equal(h.read('handLimit(0)'),8);
});
test('debt-only excess returns only unprotected excess, matching existing hand-limit rule',async t=>{
 const h=await fixture(t);h.run('commandCounts[0]=10');await h.expire();
 assert.equal(h.read('commandCounts[0]'),6);assert.equal(h.read('komePlace'),104);assert.equal(h.read('turn'),1);
});
test('global Great Depression protects debt after all discardable cards are gone',async t=>{
 const h=await fixture(t);h.run("installed[2]=[{id:'gd',type:'LEGEND',special:'greatDepression'}];commandCounts[0]=10;hands[0]=[{id:'n'}]");
 await h.expire();assert.equal(h.read('commandCounts[0]'),10);assert.equal(h.read('hands[0].length'),0);assert.equal(h.read('komePlace'),100);assert.equal(h.read('turn'),1);
});
test('Great Depression owner keeps the existing debt-count exemption',async t=>{
 const h=await fixture(t);h.run("installed[0]=[{id:'gd',type:'LEGEND',special:'greatDepression'}];commandCounts[0]=10;hands[0]=[{id:'n'}]");
 await h.expire();assert.equal(h.read('commandCounts[0]'),10);assert.equal(h.read('hands[0].length'),1);
});
test('pending start resources, chosen dice, and post-start phase resolve before timeout conversion',async t=>{
 const h=await fixture(t);h.run("pendingLordResource=1;pendingSSRBonus=1;pendingNanban=1;pendingTenkuCat=1;pendingCastResourceChoices=[{name:'maid',amount:3}];pendingOverclockChoices=[{name:'test',remaining:2}];turnStartPostPending=true");
 await h.expire();assert.deepEqual(h.read('powers[0]'),{y:10,p:0,r:0});assert.equal(h.read('turn'),1);
});
test('resource prohibition cannot strand pending choices or bypass card restrictions',async t=>{
 const h=await fixture(t);h.run("installed[0]=[{type:'LEGEND',special:'goldenAge',_eraAcquiredThisTurn:true}];pendingLordResource=1;pendingNanban=2;pendingOverclockChoices=[{remaining:3}];dice=[{id:1,value:3,used:false}]");
 await h.expire();assert.deepEqual(h.read('powers[0]'),{y:8,p:0,r:0});assert.equal(h.read('turn'),1);
});
test('all-resource prohibition settles pending queues without granting forbidden resources',async t=>{
 const h=await fixture(t);h.run("installed[0]=[{type:'LEGEND',special:'goldenAge',_eraAcquiredThisTurn:true,specialConfig:{resourceGain:{ownerBlock:['y','p','r'],acquireTurnAllSources:true}}}];pendingLordResource=1;pendingOverclockChoices=[{remaining:3}]");
 await h.expire();assert.deepEqual(h.read('powers[0]'),{y:0,p:0,r:0});assert.equal(h.read('turn'),1);
});
test('unpaid Orphans choice is cancelled without consuming a resource or card',async t=>{
 const h=await fixture(t);h.run("installed[0]=[{id:'orph',special:'graveyard'}];discard=[{id:'n',name:'n'}];powers[0].y=2;useGraveyard(0)");
 await h.expire();assert.equal(h.read('powers[0].y'),2);assert.equal(h.read('market.length+discard.length+deck.length'),1);assert.equal(h.read('hands[0].length'),0);
});
test('mandatory copy choice continues start effects safely and removes old selection',async t=>{
 const h=await fixture(t);h.run("installed[0]=[{id:'copy',special:'abilityCopy',type:'LEGEND'}];beginTurn()");
 assert.equal(h.read("q('#legendChoiceModal').classList.contains('hidden')"),false);
 await h.expire();assert.equal(h.read('turn'),1);assert.equal(h.read("q('#legendChoiceModal').classList.contains('hidden')"),true);
});
test('Yggdrasil repeat choice and extra resources resolve without pausing at a modal',async t=>{
 const h=await fixture(t);h.run("installed[0]=[{id:'q',special:'mayqueen'},{id:'m',special:'mine'}];resolveMayQueen()");
 await h.expire();assert.equal(h.read('powers[0].y'),2);assert.equal(h.read('turn'),1);
});
test('Bot copy choice rendered disabled for the human viewer still resolves on timeout',async t=>{
 const h=await fixture(t);h.run("botMatchMode=true;onlineDebugMode=true;onlineDebugPlayers=['human','bot1','bot2','bot3'];turn=1;viewer=0;testClockState.active=null;installed[1]=[{id:'copy',special:'abilityCopy',type:'LEGEND'}];beginTurn()");
 assert.equal(h.read("q('#legendChoiceCards button').disabled"),true);
 await h.expire();assert.equal(h.read('turn'),2);assert.equal(h.read("q('#legendChoiceModal').classList.contains('hidden')"),true);
});
test('pending Park selections for all players finish automatically',async t=>{
 const h=await fixture(t);h.run("pendingParkPlayers=[0,1,2];market=[{id:'a',key:'a',type:'N',name:'a'},{id:'b',key:'b',type:'N',name:'b'},{id:'c',key:'c',type:'N',name:'c'}]");
 await h.expire();assert.equal(h.read('pendingParkPlayers.length'),0);assert.deepEqual(h.read('hands.map(x=>x.length)'),[1,1,1,0]);assert.equal(h.read('turn'),1);
});
test('already-paid Genesis choice resolves its four installations before normal finalization',async t=>{
 const h=await fixture(t);h.run("hands[0]=Array.from({length:4},(_,i)=>({id:'free'+i,key:'test'+i,type:'N',name:'test',vp:0}));resolveEggHarp(0)");
 await h.expire();assert.equal(h.read('installed[0].length'),4);assert.equal(h.read('hands[0].length'),0);assert.equal(h.read('turn'),1);
});
test('timeout cancels asynchronous unpaid legend payment',async t=>{
 const h=await fixture(t);const pending=h.run("selectLegendPayment({name:'test'},'any',1)");
 await h.expire();assert.equal(await pending,null);assert.equal(h.read('turn'),1);assert.equal(h.read('legendPaymentPending'),false);
});
test('ordinary end button remains usable after timeout',async t=>{
 const h=await fixture(t);await h.expire();h.run("q('#endturn').click();q('#confirmEndTurn').click()");
 assert.equal(h.read('turn'),2);assert.equal(h.read('testClockState.remaining[1]'),180000);
});
test('time can expire while the ordinary hand-limit selection is open',async t=>{
 const h=await fixture(t);h.run("hands[0]=Array.from({length:9},(_,i)=>({id:'n'+i,name:'test',type:'N'}));showHandLimit()");
 assert.equal(h.read("q('#limit').classList.contains('hidden')"),false);
 await h.expire();assert.equal(h.read('hands[0].length'),6);assert.equal(h.read('turn'),1);
 assert.equal(h.read("q('#limit').classList.contains('hidden')"),true);
});
test('native dialogue elapsed time is caught when the dialogue closes',async t=>{
 const h=await fixture(t);h.dom.window.confirm=()=>{h.jump(180001);return true};
 assert.equal(h.run("testClockConfirm('test')"),false);await Promise.resolve();await Promise.resolve();assert.equal(h.read('turn'),1);
});
test('game-ending final turn uses existing game-over path and stops the clock',async t=>{
 const h=await fixture(t);h.run('endgameStarter=3;endgameRemaining=1');await h.expire();
 assert.equal(h.read('gameEnded'),true);assert.equal(h.read('testClockState.active'),null);h.advance(900000);assert.equal(h.read('turn'),0);
});
test('resource-derived victory reached by timeout starts the final round for the expiring player',async t=>{
 const h=await fixture(t);h.run("installed[0]=[{id:'spirit',type:'N',special:'inadamashii',name:'spirit'}];powers[0]={y:59,p:0,r:0};dice=[{id:1,value:1,used:false}]");
 await h.expire();assert.equal(h.read('endgameStarter'),0);assert.equal(h.read('endgameRemaining'),3);assert.equal(h.read('canAcquireDebt()'),false);
 for(let i=0;i<3;i++)h.run('completeEnd()');assert.equal(h.read('gameEnded'),true);
});
test('background elapsed time expires once, leaves next player with a full clock',async t=>{
 const h=await fixture(t);h.advance(3600000);assert.equal(h.read('turn'),1);
 assert.equal(h.read('testClockState.remaining[0]'),30000);assert.equal(h.read('testClockState.remaining[1]'),180000);
});
test('late click at zero cannot consume next player action or end two turns',async t=>{
 const h=await fixture(t);h.jump(180001);h.run("q('#endturn').click()");
 assert.equal(h.read('turn'),1);assert.equal(h.read("q('#endTurnConfirmModal').classList.contains('hidden')"),true);
});
test('reroll does not reset time; a new game does reset each player to 180',async t=>{
 const h=await fixture(t);h.advance(40000);h.run('beginTurn()');assert.equal(h.read('testClockState.remaining[0]'),140000);
 h.run('resetGameEndState()');assert.deepEqual(h.read('testClockState.remaining'),[180000,180000,180000,180000]);assert.equal(h.read('testClockState.active'),null);
});
test('reentrant end hooks cannot add recovery twice or skip a player',async t=>{
 const h=await fixture(t);h.advance(40000);h.run("const oldHook=runInstalledPackHooks;runInstalledPackHooks=(name,p)=>{if(name==='turnEnd')completeEnd();return oldHook(name,p)};completeEnd()");
 assert.equal(h.read('turn'),1);assert.equal(h.read('testClockState.remaining[0]'),170000);
});
test('a sleeping Bot cannot act on the new turn after timeout',async t=>{
 const h=await fixture(t);h.run("botMatchMode=true;onlineDebugMode=true;onlineDebugPlayers=['human','bot1','bot2','bot3'];turn=1;testClockState.active=null;testClockBeginTurn()");
 const bot=h.run('botExecuteTurn()');h.advance(180001);assert.equal(h.read('turn'),2);
 h.jump(2000);await h.flush();await bot;
 assert.equal(h.read('turn'),2);assert.equal(h.read('testClockState.remaining[1]'),30000);assert.equal(h.read('botBusy'),false);
});
test('Bot timeout during its final pause cannot end the following player turn',async t=>{
 const h=await fixture(t);h.run("botMatchMode=true;onlineDebugMode=true;onlineDebugPlayers=['human','bot1','bot2','bot3'];turn=1;testClockState.active=null;testClockBeginTurn();botTryInstall=()=>false;botTryScout=()=>false;botTryHire=()=>false;");
 const bot=h.run('botExecuteTurn()');h.jump(900);await h.flush();h.jump(500);await h.flush();
 assert.ok(h.delays().includes(1200),'Bot reached final pause');
 await h.expire();h.jump(1200);await h.flush();await bot;assert.equal(h.read('turn'),2);assert.equal(h.read('botBusy'),false);
});
