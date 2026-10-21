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
  else if(m.event==='selection_request_242'&&to===0)h.run(`receiveSelection242(${p})`);
  else if(m.event==='selection_result_242')h.run(`applySelectionResult242(${p})`);
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

test('242 online off-turn chooser alone can answer LL4, active coordinator commits exact hire and broadcasts all devices',async t=>{
 const r=await room(t);r.guest.run('chooseNamedHireForLegend(2);turnClockPublishAction(false)');await r.drain();
 assert.equal(r.guest.dom.window.document.querySelector('#effectSelect242'),null);
 const other=r.clients[2],select=other.dom.window.document.querySelector('#effectSelect242');assert.ok(select);choose(other,'#effectSelect242',select.options[1].value);other.dom.window.document.querySelector('#selectionConfirm242').click();await r.drain();
 r.same('employees[2].length',1);r.same('employees[1].length',0);r.same('pendingSelections242.length',0);r.same('turn',1);
});
test('242 online selection rejects foreign client, stale lease and invalid option; legitimate cancellation preserves state',async t=>{
 const r=await room(t);r.guest.run('chooseNamedHireForLegend(2);turnClockPublishAction(false)');await r.drain();
 const base=r.host.read("({client:'p1',match:turnClockNet.match,epoch:turnClockNet.epoch,token:turnClockState.token,id:pendingSelections242[0].id,owner:2,value:pendingSelections242[0].options[0].key})");
 for(const payload of [base,{...base,client:'p2',token:-1},{...base,client:'p2',value:'foreign'}])r.host.run('receiveSelection242('+JSON.stringify(payload)+')');
 r.same('pendingSelections242.length',1);r.same('employees[2].length',0);
 r.clients[2].dom.window.document.querySelector('#selectionCancel242').click();await r.drain();r.same('pendingSelections242.length',0);r.same('employees[2].length',0);
 r.host.run('receiveSelection242('+JSON.stringify({...base,client:'p2'})+')');r.same('employees[2].length',0);
});
test('242 online employee selection retains exact counterpart instance through host snapshot roundtrip',async t=>{
 const r=await room(t);r.guest.run("employees[2]=[{...CAST_TYPES.CR1,individual:'a'},{...CAST_TYPES.CR1,individual:'b'}];resolveHoneyTrap242(1);turnClockPublishAction(false)");await r.drain();
 const s=r.guest.dom.window.document.querySelector('#effectSelect242');choose(r.guest,'#effectSelect242',s.options[2].value);r.guest.dom.window.document.querySelector('#selectionConfirm242').click();await r.drain();r.same('employees[2].map(e=>e.individual)',['a']);r.same('pendingSelections242.length',0);
});
test('242 online Procurement waits for each actual recipient, applying exact allocations once across all devices',async t=>{
 const r=await room(t);r.guest.run('resolveProcurement242(1);turnClockPublishAction(false)');await r.drain();
 for(let p=0;p<4;p++){
  const h=r.clients[p];assert.equal(h.run('pendingSelections242[0].owner'),p);const total=p===1?15:5;
  for(const [key,n] of [['y',0],['p',total],['r',0]])choose(h,'select[data-resource='+key+']',String(n));
  h.dom.window.document.querySelector('#selectionConfirm242').click();await r.drain();
 }
 r.same('powers.map(p=>p.p)',[5,15,5,5]);r.same('pendingSelections242.length',0);
});
test('242 online reloaded coordinator reconstructs LL4 selection from serializable descriptor without losing paid acquisition',async t=>{
 const r=await room(t);r.guest.run('chooseNamedHireForLegend(1);turnClockPublishAction(false)');await r.drain();r.guest.run('selectionCallbacks242.clear();renderSelections242()');
 const s=r.guest.dom.window.document.querySelector('#effectSelect242');choose(r.guest,'#effectSelect242',s.options[1].value);r.guest.dom.window.document.querySelector('#selectionConfirm242').click();await r.drain();r.same('employees[1].length',1);r.same('pendingSelections242.length',0);
});
test('242 timeout host can finish required Genesis discards with no originating closures and cancels unconfirmed optional allocation safely',async t=>{
 const r=await room(t);r.guest.run("installed=Array.from({length:4},(_,p)=>[{id:'s'+p,type:'S',name:'mine'}]);temporary[1]=[{id:'extra',type:'N',name:'extra'}];resolveScorchedEarth(1);turnClockPublishAction(false)");await r.drain();assert.equal(r.host.run('selectionCallbacks242.size'),0);r.host.run('closeSelections242()');assert.equal(r.host.run('pendingSelections242.length'),0);assert.equal(r.host.run('discard.length'),5);assert.equal(r.host.run('installed.flat().length+temporary.flat().length'),0);
});
