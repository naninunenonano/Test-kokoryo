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
  else if(m.event==='trade_choice_241'&&to===0)h.run(`receiveTradeChoice241(${p})`);
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
function choose(h,selector,value){const e=h.dom.window.document.querySelector(selector);assert.ok(e,selector);e.value=value;e.dispatchEvent(new h.dom.window.Event('change'))}
async function openTrade(r){r.guest.run("employees[1]=[{...CAST_TYPES.CN1,individual:'a',_firstBreadUsed:true},{...CAST_TYPES.CN1,individual:'b',copiedFrom:'CN3'}];employees[2]=[{...CAST_TYPES.CR2,individual:'c'}];resolveTrade241(1);turnClockPublishAction(false)");await r.drain()}
test('241 online Trade lets owner offer only their instance and waits for the named counterpart client, then preserves all copied state on every device',async t=>{const r=await room(t);await openTrade(r);const own=r.clients[1],other=r.clients[2];choose(own,'#tradeTarget241','2');choose(own,'#tradeEmployee241',own.run('employees[1][1]._tradeId241'));own.dom.window.document.querySelector('#tradeConfirm241').click();await r.drain();r.same('pendingTrade241.target',2);r.same('employees[1].map(e=>e.individual)',['a','b']);assert.equal(own.dom.window.document.querySelector('#tradeEmployee241').disabled,true);assert.equal(other.dom.window.document.querySelector('#tradeEmployee241').disabled,false);assert.equal(other.dom.window.document.querySelector('#tradeTarget241'),null);choose(other,'#tradeEmployee241',other.run('employees[2][0]._tradeId241'));other.dom.window.document.querySelector('#tradeConfirm241').click();await r.drain();r.same('pendingTrade241',null);r.same('employees[1].map(e=>e.individual)',['a','c']);r.same('employees[2][0].individual','b');r.same('employees[2][0].copiedFrom','CN3');r.same('turn',1)});
test('241 online Trade rejects initiator answering for counterpart, wrong-client/foreign-instance replay and ordinary owner snapshots while waiting',async t=>{const r=await room(t);await openTrade(r);const h=r.guest;choose(h,'#tradeTarget241','2');choose(h,'#tradeEmployee241',h.run('employees[1][0]._tradeId241'));h.dom.window.document.querySelector('#tradeConfirm241').click();await r.drain();const base=r.host.read("({client:'p1',match:turnClockNet.match,epoch:turnClockNet.epoch,token:turnClockState.token,id:pendingTrade241.id,player:2,kind:'pick',key:employees[2][0]._tradeId241})");r.host.run('receiveTradeChoice241('+JSON.stringify(base)+')');assert.ok(r.host.run('pendingTrade241'));base.client='p2';base.key=r.host.run('employees[1][0]._tradeId241');r.host.run('receiveTradeChoice241('+JSON.stringify(base)+')');assert.ok(r.host.run('pendingTrade241'));h.run('employees[1]=[];pendingTrade241=null;turnClockPublishAction(false)');await r.drain();r.same('employees[1].map(e=>e.individual)',['a','b']);r.same('pendingTrade241.target',2)});
test('241 online counterpart cancellation completes safely and stale consent cannot affect a subsequent trade',async t=>{const r=await room(t);await openTrade(r);const h=r.guest;choose(h,'#tradeTarget241','2');choose(h,'#tradeEmployee241',h.run('employees[1][0]._tradeId241'));h.dom.window.document.querySelector('#tradeConfirm241').click();await r.drain();const old=r.clients[2].read("({client:'p2',match:turnClockNet.match,epoch:turnClockNet.epoch,token:turnClockState.token,id:pendingTrade241.id,player:2,kind:'pick',key:employees[2][0]._tradeId241})");r.clients[2].dom.window.document.querySelector('#tradeModal241 .secondary').click();await r.drain();r.same('pendingTrade241',null);r.same('employees[1].map(e=>e.individual)',['a','b']);r.guest.run('resolveTrade241(1);turnClockPublishAction(false)');await r.drain();r.host.run('receiveTradeChoice241('+JSON.stringify(old)+')');r.same('pendingTrade241.target',null)});
