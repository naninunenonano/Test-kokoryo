const {test}=require('node:test');
const assert=require('node:assert/strict');
const {fixture}=require('./clock.cjs');

// Four independent DOMs, timers, wall clocks and game closures. Transport can
// duplicate, reorder, delay or drop messages without touching live Supabase.
async function room(t,{owner=1}={}){
 const clients=await Promise.all([0,1,2,3].map(()=>fixture(t)));
 const queue=[];
 clients.forEach((h,i)=>{
  h.dom.window.__send=message=>{queue.push({from:i,...JSON.parse(JSON.stringify(message))});return Promise.resolve('ok')};
  h.run(`realOnlineMainMode=true;debugLocalMode=false;realLobbyPhase='main';realLobbyClientId='p${i}';realLobbyHostId='p0';viewer=${i};
   realMainRoster=[0,1,2,3].map(p=>({client_id:'p'+p,name:'P'+p,charId:'P1'}));
   realLobbyChannel={send:m=>window.__send(m)};turn=${owner};turnClockState.active=${owner};`);
 });
 clients[0].run('turnClockInitializeAuthority();turnClockNet.initial=false');
 const initial=clients[0].read('realMainSnapshot()');
 for(const h of clients.slice(1))h.run(`applyRealMainSnapshot(${JSON.stringify(initial)})`);
 function deliver(m,to){
  const h=clients[to],p=JSON.stringify(m.payload);
  if(m.event==='clock_action'&&to===+h.read('realLobbyHostId.slice(1)'))h.run(`turnClockReceiveAction(${p})`);
  else if(m.event==='park_pick'&&to===+h.read('realLobbyHostId.slice(1)'))h.run(`turnClockReceivePark(${p})`);
  else if(m.event==='main_state')h.run(`turnClockReceiveState(${p})`);
  else if(m.event==='clock_pulse')h.run(`turnClockReceivePulse(${p})`);
 }
 async function drain(){
  for(let count=0;queue.length;count++){
   assert.ok(count<200,'bounded message exchange');const m=queue.shift();
   for(let i=0;i<clients.length;i++)if(i!==m.from)deliver(m,i);
  }
  for(let i=0;i<10;i++)await Promise.resolve();
 }
 return {clients,host:clients[0],guest:clients[owner],queue,deliver,drain,
  same(expr,expected){for(const h of clients)assert.deepEqual(h.read(expr),expected)}};
}
test('online: standard commands, per-card usage, draws and dynamic warehouse limits survive synchronization',async t=>{
 const r=await room(t);
 r.guest.run("installed[1]=[{id:'w1',special:'warehouse'},{id:'w2',special:'warehouse'}];temporary[1]=[{id:'w3',special:'warehouse'}];dice=[{id:1,value:3,used:false}];deck=[{id:'drawn',name:'card'}];breadDeck=[{id:'order',value:4}];cardCommands.pool('y',3);cardCommands.draw('deck',1);cardCommands.draw('command',1);useStdAbility('s4-a','permit',1);useStdAbility('s4-b','restrict',1);turnClockPublishAction(false)");
 await r.drain();r.same('stdAbilityUsed',{'s4-a':true,'s4-b':true});r.same('dice[0].value',1);
 r.same('handLimit(1)',12);r.same('hands[1].map(c=>c.id)',['drawn']);r.same('breadHands[1].map(c=>c.id)',['order']);r.same('powers[1].y',3);
 r.guest.run('installed[1].shift();temporary[1]=[];turnClockPublishAction(false)');await r.drain();r.same('handLimit(1)',8);
});
test('online: guest actions synchronize; device wall-clock offset cannot choose deadline',async t=>{
 const r=await room(t);r.guest.dom.window.Date.now=()=>9e12;
 r.guest.run('powers[turn].y=7;turnClockPublishAction(false)');await r.drain();r.same('powers[1].y',7);
 r.host.advance(50000);await r.drain();
 r.guest.run('completeEnd()');assert.equal(r.guest.read('turn'),1,'no speculative turn advance');
 await r.drain();r.same('turn',2);r.same('turnClockState.remaining[1]',160000);
 r.same('turnClockState.active',2);
});
test('online: only HOST times out; unused dice use the shared normal conversion',async t=>{
 const r=await room(t);
 r.guest.run('dice=[1,3,6].map((value,i)=>({id:i+1,value,used:false}));turnClockPublishAction(false)');await r.drain();
 r.guest.advance(999999);assert.equal(r.guest.read('turn'),1,'guest cannot commit an expiry');
 r.host.advance(180001);await r.drain();r.same('turn',2);r.same('powers[1]',{y:1,p:1,r:1});r.same('turnClockState.remaining[1]',30000);
});
test('online: duplicate end request and late prior-lease state advance exactly once',async t=>{
 const r=await room(t);r.guest.run('completeEnd()');const request=r.queue.shift();
 r.deliver(request,0);r.deliver(request,0);await r.drain();
 r.deliver(request,0);await r.drain();r.same('turn',2);r.same('turnClockState.remaining[1]',180000);
});
test('online: timeout wins an end/deadline race and rejects a late resource mutation',async t=>{
 const r=await room(t);r.guest.run('powers[1].y=999;completeEnd()');
 r.host.jump(180001);await r.drain();r.same('turn',2);r.same('powers[1].y',0);r.same('turnClockState.remaining[1]',30000);
});
test('online: newer speculative owner actions survive an earlier HOST echo',async t=>{
 const r=await room(t);r.guest.run('powers[1].y=1;turnClockPublishAction(false)');
 const one=r.queue.shift();r.deliver(one,0);
 r.guest.run('powers[1].y=2;turnClockPublishAction(false)');
 await r.drain();r.same('powers[1].y',2);
});
test('online: out-of-order actions and snapshots cannot roll back state',async t=>{
 const r=await room(t);r.guest.run('powers[1].y=1;turnClockPublishAction(false);powers[1].y=2;turnClockPublishAction(false)');
 const first=r.queue.shift(),second=r.queue.shift();r.deliver(second,0);r.deliver(first,0);await r.drain();r.same('powers[1].y',2);
 const stale=r.host.read('realMainSnapshot()');r.guest.run('completeEnd()');await r.drain();
 for(const h of r.clients)h.run(`applyRealMainSnapshot(${JSON.stringify(stale)})`);r.same('turn',2);
});
test('online: next owner runs turn-start effects once and publishes the result',async t=>{
 const r=await room(t);
 r.guest.run("employees[2]=[{id:'staff',turnBread:1,firstBreadBonus:1}];breadDeck=[1,2,3,4].map(value=>({id:'b'+value,value}));turnClockPublishAction(false)");await r.drain();
 r.guest.run('completeEnd()');await r.drain();r.same('turn',2);r.same('breadHands[2].length',2);r.same('turnClockStartPending',false);
 const duplicate=r.host.read('realMainSnapshot()');r.clients[2].run(`applyRealMainSnapshot(${JSON.stringify(duplicate)})`);
 assert.equal(r.clients[2].read('breadHands[2].length'),2);
});
test('online: disconnected next owner is started and safely timed out by HOST',async t=>{
 const r=await room(t);r.guest.run('completeEnd()');
 const request=r.queue.shift();r.deliver(request,0);
 // Drop every outgoing message: next owner never receives its start lease.
 r.queue.length=0;assert.equal(r.host.read('turnClockStartPending'),true);
 r.host.advance(180001);assert.equal(r.host.read('turn'),3);assert.equal(r.host.read('turnClockState.remaining[2]'),30000);
 await r.drain();r.same('turn',3);
});
test('online: paid Genesis continuation is restored on HOST at timeout',async t=>{
 const r=await room(t);r.guest.run("hands[1]=Array.from({length:4},(_,i)=>({id:'free'+i,key:'free'+i,type:'N',name:'test',vp:0}));resolveEggHarp(1);turnClockPublishAction(false)");await r.drain();
 r.host.advance(180001);await r.drain();r.same('turn',2);r.same('installed[1].length',4);
});
test('online: HOST handoff uses a new epoch; previous HOST messages are fenced out',async t=>{
 const r=await room(t);r.host.advance(40000);await r.drain();const stale=r.host.read('realMainSnapshot()');
 for(const h of r.clients)h.run("realLobbyHostId='p1';turnClockHostChanged()");await r.drain();
 r.same('turnClockState.remaining[1]',140000);r.guest.run('completeEnd()');await r.drain();r.same('turn',2);r.same('turnClockState.remaining[1]',170000);
 for(const h of r.clients)h.run(`turnClockReceiveState({host:'p0',state:${JSON.stringify(stale)}})`);r.same('turn',2);
});
test('online: reconnect restores clock, usage flags and monotonically increasing proposal sequence',async t=>{
 const r=await room(t);r.guest.run("graveyardUsed[1]={'card-a':true};hiredThisTurn=true;turnClockPublishAction(false)");await r.drain();
 r.host.advance(30000);await r.drain();const state=r.host.read('realMainSnapshot()');
 r.guest.run(`turnClockResetNet();applyRealMainSnapshot(${JSON.stringify(state)});powers[1].y=8;turnClockPublishAction(false)`);await r.drain();
 r.same('powers[1].y',8);r.same('graveyardUsed[1]',{'card-a':true});r.same('hiredThisTurn',true);r.same('turnClockState.remaining[1]',150000);
});
test('online: non-turn Park pick is committed only by HOST and cannot be replayed',async t=>{
 const r=await room(t);r.guest.run("pendingParkPlayers=[3];market=[{id:'park',key:'S5',name:'mine',type:'S',special:'mine'}];turnClockPublishAction(false)");await r.drain();
 r.clients[3].run("turnClockRequestPark(3,'S5')");const request=r.queue.shift();r.deliver(request,0);r.deliver(request,0);await r.drain();
 r.same('hands[3].length',1);r.same('pendingParkPlayers.length',0);
});
test('online: HOST player can end normally without a speculative second end',async t=>{
 const r=await room(t,{owner:0});r.host.advance(50000);r.host.run('completeEnd()');await r.drain();
 r.same('turn',1);r.same('turnClockState.remaining[0]',160000);
});
for(const owner of [0,1])test(`online: instant game finish by P${owner} synchronizes and stops every clock`,async t=>{
 const r=await room(t,{owner});r.guest.run('finishGame();turnClockPublishAction(false)');await r.drain();
 r.same('gameEnded',true);r.same('turnClockState.active',null);
 for(const h of r.clients)h.advance(999999);r.same('turn',owner);
});
test('online: forced end cancels the guest unpaid async payment promise',async t=>{
 const r=await room(t);const payment=r.guest.run("selectLegendPayment({name:'test'},'any',1)");
 r.host.advance(180001);await r.drain();assert.equal(await payment,null);r.same('turn',2);
});
test('online: pending copy continuation restores on HOST before timeout start effects',async t=>{
 const r=await room(t);r.guest.run("installed[1]=[{id:'copy',type:'LEGEND',special:'abilityCopy',name:'copy'}];resolveAbilityCopyLegend(()=>continueBeginTurn());turnClockPublishAction(false)");await r.drain();
 assert.equal(r.guest.read("q('#legendChoiceModal').classList.contains('hidden')"),false);
 r.host.advance(180001);await r.drain();r.same('turn',2);r.same('turnClockState.remaining[1]',30000);
 assert.ok(r.host.read('powers[1].y+powers[1].p+powers[1].r')>=4,'mandatory start dice/resources were not lost');
});
test('online: HOST reload charges elapsed checkpoint time and retains accepted sequence',async t=>{
 const r=await room(t);r.guest.run('powers[1].y=4;turnClockPublishAction(false)');await r.drain();
 const saved=r.host.read('realMainSnapshot()');r.host.jump(45000);
 r.host.run(`turnClockResetNet();applyRealMainSnapshot(${JSON.stringify(saved)})`);
 assert.equal(r.host.read('turnClockState.remaining[1]'),135000);
 r.host.tick();await r.drain();r.guest.run('completeEnd()');await r.drain();r.same('turn',2);r.same('turnClockState.remaining[1]',165000);
});
test('online: legacy snapshots are rejected instead of silently disabling clocks',async t=>{
 const r=await room(t);const legacy=r.host.read('realMainSnapshot()');delete legacy.turnClock;legacy.turn=3;
 r.guest.run(`applyRealMainSnapshot(${JSON.stringify(legacy)})`);assert.equal(r.guest.read('turn'),1);
});
test('online: dropped end acknowledgement is recovered by idempotent retry',async t=>{
 const r=await room(t);r.guest.run('completeEnd()');r.deliver(r.queue.shift(),0);r.queue.length=0;
 assert.equal(r.guest.read('turn'),1);r.guest.advance(1001);await r.drain();r.same('turn',2);r.same('turnClockState.remaining[1]',180000);
});
test('online: stale owner proposal cannot undo an accepted other-player Park pick',async t=>{
 const r=await room(t);r.guest.run("pendingParkPlayers=[3];market=[{id:'park',key:'S5',name:'mine',type:'S',special:'mine'}];turnClockPublishAction(false)");await r.drain();
 r.guest.run('powers[1].y=10;turnClockPublishAction(false)');const stale=r.queue.shift();
 r.clients[3].run("turnClockRequestPark(3,'S5')");r.deliver(r.queue.shift(),0);r.deliver(stale,0);await r.drain();
 r.same('hands[3].length',1);r.same('pendingParkPlayers.length',0);r.same('powers[1].y',0);
});

test('online: N8–N10 reroll reactions and S1 once synchronize exactly once',async t=>{
 const r=await room(t);r.guest.run("Math.random=()=>0;installed[0]=[{id:'law1',special:'laws'},{id:'law2',special:'laws'}];dice=[{id:1,value:2,used:false},{id:2,value:1,used:false}];useStdAbility('s1','plan',1);turnClockPublishAction(false)");
 await r.drain();r.same('commandCounts[1]',2);r.same('powers[0].y',2);r.same('stdAbilityUsed',{s1:true});
 r.guest.run("useStdAbility('s1','plan',1);turnClockPublishAction(false)");await r.drain();r.same('commandCounts[1]',2);
});
test('online: N1 sequential choices survive snapshots; a later player cannot skip the queue',async t=>{
 const r=await room(t);r.guest.run("deck=Array.from({length:8},(_,i)=>({id:'c'+i,key:'K'+i,name:'card'+i,type:'N'}));market=[];gameSettings.marketTypes=4;resolveOnInstall({special:'paneteria'},1);turnClockPublishAction(false)");await r.drain();
 r.same('pendingParkPlayers',[1,2,3,0]);
 r.clients[3].run("turnClockRequestPark(3,market[0].key)");await r.drain();r.same('hands[3].length',0);
 for(const p of [1,2,3,0]){r.clients[p].run(`turnClockRequestPark(${p},market[0].key)`);await r.drain()}
 r.same('pendingParkPlayers.length',0);for(const p of [0,1,2,3])r.same(`hands[${p}].length`,1);
});
test('online: N11/N14 individual once ledgers and moves survive reconnect snapshots',async t=>{
 const r=await room(t);r.guest.run("renderGame=()=>{};installed[1]=[{id:'g1',special:'graveyard'},{id:'g2',special:'graveyard'},{id:'m1',special:'publicmarket'}];powers[1]={y:10,p:0,r:0};discard=[{id:'recovered',name:'recovered'}];chooseLegendCard=(title,note,opts,choose)=>choose(opts[0]);useGraveyard(0);q('#legendChoiceCards').children[0].click();market=[{id:'taken',key:'K',name:'taken'}];deck=[];window.__prompts=['1','1'];turnClockPrompt=()=>window.__prompts.shift()??null;usePublicMarket(2);turnClockPublishAction(false)");await r.drain();
 r.same('graveyardUsed[1]',{g1:true});r.same('publicMarketUsed[1]',{m1:true});r.same('hands[1].map(c=>c.id)',['taken']);
 const snap=r.host.read('realMainSnapshot()');r.guest.run(`applyRealMainSnapshot(${JSON.stringify(snap)})`);r.same('graveyardUsed[1]',{g1:true});
});
