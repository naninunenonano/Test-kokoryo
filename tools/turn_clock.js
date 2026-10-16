// Injected into the game's closure by the TEST builder; never shipped to production.
var testClockState={remaining:[],active:null,token:0,lastCompleted:-1,ending:false,expiring:false,resolving:false,timeoutCommit:null,mono:0,wall:0};
const TEST_CLOCK_INITIAL=180000,TEST_CLOCK_INCREMENT=30000;
const TEST_CLOCK_CANCEL=Object.freeze({cancelledBotTurn:true});
function testClockVisible(){return !!q('#game')&&!q('#game').classList.contains('hidden')}
function testClockReset(){
 if(!testClockState)return;
 const token=testClockState.token+1;
 testClockState={remaining:Array(playerCount).fill(TEST_CLOCK_INITIAL),active:null,token,lastCompleted:-1,ending:false,expiring:false,resolving:false,timeoutCommit:null,mono:performance.now(),wall:Date.now()};
 if(botTimer!==null){clearTimeout(botTimer);botTimer=null}
 testClockRender();
}
function testClockAccount(){
 const s=testClockState;if(!s)return;
 const mono=performance.now(),wall=Date.now();
 // Safari may suspend interval callbacks. Use elapsed time, not tick counts.
 const elapsed=Math.max(0,mono-s.mono,wall-s.wall);
 if(s.active!==null&&!s.ending&&!s.expiring&&!gameEnded&&testClockVisible())
  s.remaining[s.active]=Math.max(0,s.remaining[s.active]-elapsed);
 s.mono=mono;s.wall=wall;
}
function testClockBeginTurn(){
 const s=testClockState;if(!s||gameEnded)return;
 // Reroll/debug beginTurn on the same turn neither resets time nor grants increment.
 if(s.active===turn){testClockAccount();return}
 while(s.remaining.length<playerCount)s.remaining.push(TEST_CLOCK_INITIAL);
 s.active=turn;s.token++;s.mono=performance.now();s.wall=Date.now();
 testClockRender();
}
function testClockStop(){if(!testClockState)return;testClockAccount();testClockState.active=null;testClockRender()}
function testClockLeaseValid(owner,token){const s=testClockState;return !!s&&s.active===owner&&turn===owner&&s.token===token&&!gameEnded}
function testClockBotValid(owner,token){return testClockLeaseValid(owner,token)&&!testClockState.expiring}
function testClockRender(){
 const s=testClockState;if(!s)return;
 let box=q('#testTurnClock');
 if(!box){box=document.createElement('section');box.id='testTurnClock';box.className='notice';box.setAttribute('aria-label','プレイヤー別持ち時間');q('#game')?.prepend(box)}
 if(!box)return;
 box.innerHTML='<strong>持ち時間</strong> <span class="small">自分のターンのみ消費・終了時＋30秒（上限180秒）</span>';
 const row=document.createElement('div');row.className='row';row.style.cssText='justify-content:flex-start;gap:8px;flex-wrap:wrap;margin-top:6px';
 for(let p=0;p<playerCount;p++){
  const secs=Math.ceil((s.remaining[p]??TEST_CLOCK_INITIAL)/1000),el=document.createElement('span');
  el.className='power';el.dataset.clockPlayer=p;el.dataset.seconds=secs;
  const active=s.active===p&&!gameEnded;el.dataset.active=String(active);
  el.style.cssText=active?'border:2px solid #a36d00;background:#fff1b8;font-weight:700':'';
  el.textContent='P'+(p+1)+' '+secs+'秒 ('+Math.floor(secs/60)+':'+String(secs%60).padStart(2,'0')+')'+(active?' ▶':'');row.appendChild(el);
 }
 box.appendChild(row);
}
function testClockTick(){
 const s=testClockState;if(!s)return;
 testClockAccount();testClockRender();
 if(s.active!==null&&s.remaining[s.active]<=0&&!s.expiring&&!s.ending&&!gameEnded&&testClockVisible())testClockExpire(s.token);
}
function testClockPrompt(message,initial){
 if(testClockState?.resolving)return initial??'1';
 const result=window.prompt(message,initial);testClockAccount();
 if(testClockState?.active!==null&&testClockState.remaining[testClockState.active]<=0){queueMicrotask(testClockTick);return null}
 return result;
}
function testClockConfirm(message){
 if(testClockState?.resolving)return false; // optional acquisitions are declined
 const result=window.confirm(message);testClockAccount();
 if(testClockState?.active!==null&&testClockState.remaining[testClockState.active]<=0){queueMicrotask(testClockTick);return false}
 return result;
}
function testClockResolvePending(owner,token){
 for(const overlay of document.querySelectorAll('[data-test-clock-payment]'))overlay.__testClockCancel?.();
 legendPaymentPending=false;
 for(let guard=0;guard<10000;guard++){
  if(!testClockLeaseValid(owner,token))return;
  const modal=q('#legendChoiceModal');
  if(modal&&!modal.classList.contains('hidden')){
   const title=q('#legendChoiceTitle').textContent;
   if(title==='オルフェンズ'||title==='消費する資源')q('#legendChoiceCancel').click();
   else{
    const pick=q('#legendChoiceCards .selectable-card')||q('#legendChoiceCards button:not(:disabled)');
    if(pick)pick.click();else q('#legendChoiceCancel').click();
   }
   continue;
  }
  if(pendingSSRBonus>0){gainSSRDie(1);continue}
  const color=['y','p','r'].find(c=>eraGainAllowed(owner,c,'effect'));
  if(!color){
   // Prohibited resource gains must not leave an unfinishable selection.
   pendingLordResource=0;pendingNanban=0;pendingTenkuCat=0;pendingCastResourceChoices=[];pendingOverclockChoices=[];
  }else{
   if(pendingOverclockChoices.length){gainOverclockResource(color);continue}
   if(pendingCastResourceChoices.length){gainCastResource(color);continue}
   if(pendingLordResource>0){gainLordResource(color);continue}
   if(pendingNanban>0){gainNanban(color);continue}
   if(pendingTenkuCat>0){gainTenkuCat(color);continue}
  }
  if(turnStartPostPending){renderGame();continue}
  if(pendingParkPlayers.length){
   const key=groups().keys().next().value;
   if(key===undefined)finishEmptyParkChoices();else applyOnlineParkPick(pendingParkPlayers[0],key);
   continue;
  }
  nightEscapePostAvailable=false;return;
 }
 throw new Error('持ち時間終了時の未解決選択が安全上限を超えました。');
}
function testClockDiscardOverflow(owner){
 // Uniformly choose among both normal cards and command sheets; debt is excluded.
 while(totalHandCount(owner)>handLimit(owner)){
  const n=hands[owner].length+breadHands[owner].length;if(!n)break;
  const i=Math.min(n-1,Math.floor(Math.random()*n));
  if(i<hands[owner].length)discard.push(hands[owner].splice(i,1)[0]);
  else breadDiscard.push(breadHands[owner].splice(i-hands[owner].length,1)[0]);
 }
 recycleBreadIfEmpty();
 if(totalHandCount(owner)>handLimit(owner)&&!depressionProtectsDebtAtHandLimit()&&!depressionDebtLocked(owner)){
  const returned=Math.min(totalHandCount(owner)-handLimit(owner),commandCounts[owner]||0);
  commandCounts[owner]-=returned;komePlace+=returned;
 }
}
function testClockCloseChoices(){
 for(const modal of document.querySelectorAll('.imgmodal')){
  modal.classList.add('hidden');
 }
 for(const selector of ['#legendChoiceCards','#parkChoiceCards']){
  const grid=q(selector);if(!grid)continue;
  for(const el of grid.querySelectorAll('*'))el.onclick=null;
  grid.replaceChildren();
 }
 if(q('#legendChoiceCancel'))q('#legendChoiceCancel').onclick=null;
 q('#limit')?.classList.add('hidden');
 pendingBreadAnyIndex=null;pendingResourceFrom=null;clearMarketUndo();
}
function testClockExpire(token){
 const s=testClockState,owner=s?.active;
 if(!s||s.expiring||s.ending||owner===null||!testClockLeaseValid(owner,token))return;
 s.expiring=true;s.resolving=true;s.remaining[owner]=0;
 if(botTimer!==null){clearTimeout(botTimer);botTimer=null}
 const oldViewer=viewer;
 try{
  viewer=owner;
  testClockResolvePending(owner,token);
  if(!testClockLeaseValid(owner,token))return;
  const totals={y:0,p:0,r:0};
  for(const die of [...unusedDice()]){
   if(!useDie(die.id))continue;
   const color=colorFor(die.value);totals[color]+=gainResource(owner,color,3,'dieConvert');
  }
  testClockDiscardOverflow(owner);testClockCloseChoices();
  addDialog('⏱ P'+(owner+1)+'の持ち時間切れ：未使用ダイスを変換（資金'+totals.y+'・食料'+totals.p+'・兵力'+totals.r+'）、手札上限を自動処理しました。');
  playLogAction('turn_clock_timeout',{player:owner+1,resources:totals});
  viewer=oldViewer;s.resolving=false;s.expiring=false;s.timeoutCommit=token;
  completeEnd();
 }finally{s.resolving=false;s.expiring=false;viewer=botMatchMode?0:viewer;testClockRender()}
}
function completeEnd(){
 const s=testClockState;
 if(!s)return testClockOriginalCompleteEnd();
 if(gameEnded||s.active===null||s.ending||s.lastCompleted===s.token)return;
 testClockAccount();
 if(s.remaining[s.active]<=0&&s.timeoutCommit!==s.token){testClockExpire(s.token);return}
 const owner=s.active;
 s.ending=true;s.lastCompleted=s.token;s.timeoutCommit=null;
 s.remaining[owner]=Math.min(TEST_CLOCK_INITIAL,s.remaining[owner]+TEST_CLOCK_INCREMENT);
 s.active=null;
 try{return testClockOriginalCompleteEnd()}finally{s.ending=false;testClockRender()}
}
// Stop a late user click before it can act on an expired player's turn.
document.addEventListener('click',event=>{
 if(!testClockState||testClockState.active===null||testClockState.resolving||!testClockVisible())return;
 if(!event.target.closest?.('#game,.imgmodal'))return;
 testClockAccount();
 if(testClockState.expiring||testClockState.remaining[testClockState.active]<=0){event.preventDefault();event.stopImmediatePropagation();testClockTick()}
},true);
setInterval(testClockTick,200);
document.addEventListener('visibilitychange',testClockTick);
window.addEventListener('pageshow',testClockTick);
testClockRender();
