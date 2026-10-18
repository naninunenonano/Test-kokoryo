// Editing source only. Build with npm run build; do not load this file directly.
// Section order and the shared private scope are preserved by src/order.json.

// @kokoryo-section S0015

function populateOnlineDebugDeckPreset(){let sel=q('#onlineDebugDeckPreset');if(!sel)return;let current=sel.dataset.selectedValue||gameSettings.deckId;sel.innerHTML='';standardDeckPresets().forEach(d=>{let o=document.createElement('option');o.value=d.id;let missing=deckMissingCards(d.id);o.disabled=!!missing.length;o.textContent=d.name+'（固定）'+(missing.length?'［必要カード不足］':'');sel.appendChild(o)});let a=document.createElement('option');a.value='allcards';a.textContent='全カードデッキ';sel.appendChild(a);let saves=getSavedDecks();Object.keys(saves).forEach(name=>{let o=document.createElement('option');o.value='saved:'+name;o.textContent=name;sel.appendChild(o)});if(current==='custom'){let name=(q('#deckSaveName')?.value||'').trim();current=name&&saves[name]?'saved:'+name:'standard1'}if(![...sel.options].some(o=>o.value===current))current='standard1';sel.value=current;sel.dataset.selectedValue=current;q('#onlineDebugEditDeck').disabled=false}
// @kokoryo-end-section S0015

// @kokoryo-section S0077

function debugNamedHire(id){
 let base=CAST_TYPES[id];if(!base)return alert('そのキャストは定義されていません。');
 if(base.rarity==='UR'&&isUniqueRareAlreadyHired(base.id))return alert('UR（ユニークレア）「'+castDisplayName(base)+'」はすでに獲得されています。');
 if((employees[turn]||[]).length>=effectiveHireLimit())return alert('雇用枠が'+effectiveHireLimit()+'人埋まっています。');
 let e={...base};
 if(hasSameOwnedUniqueAbility(e)){
  let next=redrawSameRarityCast(e);
  if(next&&turnClockConfirm(e.rarity+'「'+castDisplayName(e)+'」の《'+e.uniqueAbility+'》は、すでに所持しているキャラと同名です。\nデバッグ指名雇用でも、このキャストを雇用せず同じレアリティで再抽選しますか？'))e=next;
 }
 if(e.rarity==='CLR'){
  chooseLRAbilities({...e},made=>{employees[turn].push(made);triggerNotices.push('デバッグ：LR「'+castDisplayName(made)+'」を指名雇用しました。取得能力：'+(made.grantedAbilities||[]).map(x=>'《'+x+'》').join('＋'));renderGame()});
  return
 }
 employees[turn].push(e);triggerNotices.push('デバッグ：'+e.rarity+'「'+castDisplayName(e)+'」を指名雇用しました。');renderGame();
}
function debugGainOrder(v){
 v=+v;let i=breadDeck.findIndex(b=>b.value===v);if(i>=0){breadHands[turn].push(breadDeck.splice(i,1)[0]);renderGame();return}
 i=breadDiscard.findIndex(b=>b.value===v);if(i>=0){breadHands[turn].push(breadDiscard.splice(i,1)[0]);renderGame();return}
 alert('命令書'+v+'は山札・捨て札に残っていません。');
}
function debugGainDebt(mode){
 let results=[];
 if(mode==='self'){
  const got=acquireDebt(turn,1);
  results=[{player:turn,requested:1,received:got}];
 }else if(mode==='all'||mode==='others'){
  results=distributeDebt(turn,mode,1);
 }
 const detail=results.filter(x=>x.received>0).map(x=>'P'+(x.player+1)+'：'+x.received+'枚').join('、');
 triggerNotices.push('デバッグ：負債獲得 '+(detail||'獲得なし（置き場不足・獲得不可）'));
 renderGame();
}
let debugCardSerial=0;
let debugInitialMarketSnapshot=null;
function debugCreateCard(base){
 if(!base||isLegendCard(base)&&!legendAcquisitionAllowed(turn))return;
 let c={...base,id:base.key+'-DBG-'+(++debugCardSerial)};
 registerInstallation(turn,c);
 
 // デバッグの「無から生成」は通常の取得処理を通らないため、取得時発動のレジェンド効果をここで直接解決する。
 if(c.special==='talentRecruit')chooseNamedHireForLegend();
 if(c.special==='scorchedEarth')resolveScorchedEarth(turn);
 if(c.special==='greatRefresh')resolveGreatRefresh();
 if(c.special==='eggharp')resolveEggHarp(turn);
 // 上位レジェンドの取得時効果も、通常取得と同じ内容をコストなしでテストできるようにする。
 if(c.special==='changeOfHeart'){
  let targets=[];for(let p=0;p<playerCount;p++)if(p!==turn)(employees[p]||[]).forEach((e,i)=>targets.push({p,i,e}));
  if(!targets.length)alert('《シークレット・サーティーン》：奪える雇用キャラクターがいません。');
  else{let msg=targets.map((x,i)=>(i+1)+'. P'+(x.p+1)+' '+x.e.rarity+' '+castDisplayName(x.e)).join('\n');let raw=turnClockPrompt('《シークレット・サーティーン》\n奪う雇用キャラクターを選んでください。\n\n'+msg,'1');let n=Math.floor(+raw);if(n&&targets[n-1]){let x=targets[n-1],e=employees[x.p].splice(x.i,1)[0];employees[turn].push(e);triggerNotices.push('《シークレット・サーティーン》：P'+(x.p+1)+'の「'+castDisplayName(e)+'」をP'+(turn+1)+'が獲得しました。')}}
 }
 if(c.special==='resourceWipe'){
  for(let p=0;p<playerCount;p++)powers[p]={y:0,r:0,p:0};
  triggerNotices.push('《神々の黄昏》：全プレイヤーの全資源を捨てました。');
  triggerNotices.push('デバッグ：「'+c.name+'」を無から生成して設置しました。');q('#debugCardModal')?.classList.add('hidden');renderGame();completeEnd();return
 }
 // 《パーフェクト・イミテーション》は設置時効果を持たず、次回以降のターン開始時に通常処理される。
 if(c.special==='amanomurakumo'){triggerNotices.push('デバッグ：「'+c.name+'」を無から生成して設置しました。');q('#debugCardModal')?.classList.add('hidden');renderGame();finishGame();return}
 triggerNotices.push('デバッグ：「'+c.name+'」を無から生成して設置しました。');
 q('#debugCardModal')?.classList.add('hidden');
 renderGame();
}
function showDebugCardCreator(){
 let modal=q('#debugCardModal');
 if(!modal){
  modal=document.createElement('div');modal.id='debugCardModal';modal.className='imgmodal hidden';modal.style.zIndex='10020';
  modal.innerHTML='<div style="background:#fff;color:#222;border-radius:12px;padding:14px;max-width:1050px;width:94vw;max-height:88vh;overflow:auto"><div class="row"><div><strong>デバッグ：カード生成</strong><div class="small">山札・市場から減らさず、選んだカードを現在プレイヤーの場へ直接1枚生成・設置します。</div></div><button id="closeDebugCard" class="secondary">閉じる</button></div><div id="debugCardList" class="choice-grid" style="margin-top:12px"></div></div>';
  document.body.appendChild(modal);q('#closeDebugCard').onclick=()=>modal.classList.add('hidden');
 }
 let list=q('#debugCardList');list.innerHTML='';
 let debugCards=[...STD_BASE,...NORMAL_BASE.filter(c=>c.implemented&&isPackEnabled(c.packId))];
 LEGEND_CATALOG.filter(L=>{let n=Number(String(L.id).replace(/^(LL|LU)/,''));return n<=6 || (n<=9 && isPackEnabled('pack1')) || (n<=12 && isPackEnabled('pack2'));}).forEach(L=>debugCards.push({key:L.id,id:L.id,name:L.name,type:'LEGEND',image:resolvedContentImage(L),specialEffect:specialEffectId(L),special:specialEffectId(L)||'legend',vp:L.vp,effectText:effectText({specialEffect:specialEffectId(L),special:specialEffectId(L)})}));
 debugCards.forEach(c=>{let b=card(c,1,true);let no=document.createElement('div');no.className='small';no.style.fontWeight='800';no.style.marginBottom='4px';no.textContent='カード番号：'+(c.key||'');b.insertBefore(no,b.firstChild);let ef=document.createElement('div');ef.className='card-effect-inline';ef.textContent=effectText(c);b.appendChild(ef);b.onclick=()=>debugCreateCard(c);list.appendChild(b)});
 modal.classList.remove('hidden');
}
function showDebugDeckContents(){
 let modal=q('#debugDeckModal');if(!modal){modal=document.createElement('div');modal.id='debugDeckModal';modal.className='imgmodal hidden';modal.style.zIndex='10021';modal.innerHTML='<div style="background:#fff;color:#222;border-radius:12px;padding:14px;max-width:760px;width:94vw;max-height:88vh;overflow:auto"><div class="row"><div><strong>デバッグ：山札の内容</strong><div class="small">現在の山札を上から順に表示します。</div></div><button id="closeDebugDeck" class="secondary">閉じる</button></div><div id="debugDeckList" style="margin-top:12px"></div></div>';document.body.appendChild(modal);q('#closeDebugDeck').onclick=()=>modal.classList.add('hidden')}
 let list=q('#debugDeckList');list.innerHTML='';if(!deck.length)list.innerHTML='<div class="muted">山札は空です。</div>';else deck.forEach((c,i)=>{let d=document.createElement('div');d.className='notice';d.style.margin='5px 0';d.textContent=(i+1)+'：'+c.key+' '+c.name;list.appendChild(d)});modal.classList.remove('hidden');
}
function cloneDebugState(v){
 try{return structuredClone(v)}catch(e){return JSON.parse(JSON.stringify(v))}
}
function saveDebugInitialMarketSnapshot(){
 // 初期資源・ゲーム開始時効果の処理直後、公開場を初めて配置する直前の状態を保存する。
 // デバッグ画面を開き直しても参照できるよう、windowにも同じスナップショットを保持する。
 const keys=['playerTurnCounts','lastCountedTurnToken','oracleUpgradesThisTurn','playerCount','characters','hands','powers','installed','temporary','elekiterUsed','commandCounts','komePlace','pendingParkPlayers','pendingParkTaken','breadDeck','breadDiscard','breadHands','employees','lordFirstBreadUsed','lordOverclockUsed','pendingOverclockChoices','graveyardUsed','publicMarketUsed','market','discard','deck','turn','dice','legends','legendTakenThisTurn','endgameStarter','endgameRemaining','gameEnded','pendingLordResource','pendingNanban','pendingTenkuCat','pendingSSRBonus','pendingCastResourceChoices','hiredThisTurn','organizationUsed','fusionUsedThisTurn','nightEscapePostAvailable','nightEscapeResetNext','debugVP','copiedAbility','copiedOracleUsed','copiedTributeUsed','triggerNotices','dialogLog','initialPowerChoices','initialPowerPlayer'];
 const snap={};
 keys.forEach(k=>{try{const value=eval(k);if(typeof value!=='undefined')snap[k]=cloneDebugState(value)}catch(e){}});
 snap.market=[];snap.selectedMarketKey=null;snap.marketUndoHistory=[];snap.commandUndoHistory=[];snap.dialogLog=[];
 debugInitialMarketSnapshot=snap;
 globalThis.__kokoryoDebugInitialMarketSnapshot=cloneDebugState(snap);
}
function getDebugInitialMarketSnapshot(){
 return debugInitialMarketSnapshot||globalThis.__kokoryoDebugInitialMarketSnapshot||null;
}
function debugResetToInitialMarketPlacement(){
 const snap=getDebugInitialMarketSnapshot();
 if(!snap)return alert('まだ最初のカード配置直前の状態が保存されていません。ゲーム開始直後まで進めてから実行してください。');
 const previousMarketKeys=market.map(c=>c.key).join('|');
 const previousLegendKeys=legends.map(L=>L.id).join('|');
 const keys=['playerTurnCounts','lastCountedTurnToken','oracleUpgradesThisTurn','playerCount','characters','hands','powers','installed','temporary','elekiterUsed','commandCounts','komePlace','pendingParkPlayers','pendingParkTaken','breadDeck','breadDiscard','breadHands','employees','lordFirstBreadUsed','lordOverclockUsed','pendingOverclockChoices','graveyardUsed','publicMarketUsed','market','discard','deck','turn','dice','legends','legendTakenThisTurn','endgameStarter','endgameRemaining','gameEnded','pendingLordResource','pendingNanban','pendingTenkuCat','pendingSSRBonus','pendingCastResourceChoices','hiredThisTurn','organizationUsed','fusionUsedThisTurn','nightEscapePostAvailable','nightEscapeResetNext','debugVP','copiedAbility','copiedOracleUsed','copiedTributeUsed','triggerNotices','dialogLog','initialPowerChoices','initialPowerPlayer'];
 keys.forEach(k=>{if(Object.prototype.hasOwnProperty.call(snap,k))eval(k+'=cloneDebugState(snap[k])')});
 market=[];selectedMarketKey=null;marketUndoHistory=[];commandUndoHistory=[];dialogLog=[];resetGameEndState();
 // 保存した山札をそのまま引くと毎回同じ公開場になる。再配置時は改めてシャッフルする。
 deck=sh(deck);
 refillTo8();
 // カードの種類が複数ある場合は、再配置後に同じ公開場が残らないよう再抽選する。
 if(market.map(c=>c.key).join('|')===previousMarketKeys&&deck.length){
  const previous=market.splice(0);deck=sh([...deck,...previous]);refillTo8();
  if(market.map(c=>c.key).join('|')===previousMarketKeys){
   const different=deck.findIndex(c=>!previous.some(x=>x.key===c.key));
   if(different>=0&&market.length){let other=deck.splice(different,1)[0];deck.push(market[0]);market[0]=other;}
  }
 }
 // レジェンド置場も再抽選する（セット配置条件はinitLegendsが維持する）。
 initLegends();
 if(legends.map(L=>L.id).join('|')===previousLegendKeys){
  for(let i=0;i<5;i++){initLegends();if(legends.map(L=>L.id).join('|')!==previousLegendKeys)break;}
 }
 // デバッグ再配置では先手を再抽選せず、P1から開始する。
 turn=0;
 beginTurn();
 triggerNotices.push('デバッグ：初期状態へ戻し、公開カードとレジェンドを再抽選しました。');
 renderGame();
 if(realOnlineMainMode)broadcastRealMainState();
}
function showDebugMarketReplace(){
 let modal=q('#debugMarketReplaceModal');
 if(!modal){
  modal=document.createElement('div');modal.id='debugMarketReplaceModal';modal.className='imgmodal hidden';modal.style.zIndex='10022';
  modal.innerHTML='<div style="background:#fff;color:#222;border-radius:12px;padding:14px;max-width:1050px;width:94vw;max-height:88vh;overflow:auto"><div class="row"><div><strong>デバッグ：公開カード入れ替え</strong><div class="small">①上のカードをタップして選択 → ②下に表示される入れ替え先をタップ。選択中のカードは黄色い枠で表示されます。</div></div><button id="closeDebugMarketReplace" class="secondary">閉じる</button></div><div id="debugMarketReplaceCurrent" style="margin-top:12px"></div><div id="debugMarketReplaceList" class="choice-grid" style="margin-top:12px"></div></div>';
  document.body.appendChild(modal);q('#closeDebugMarketReplace').onclick=()=>modal.classList.add('hidden');
 }
 let current=q('#debugMarketReplaceCurrent'),list=q('#debugMarketReplaceList');current.innerHTML='';list.innerHTML='';
 let selectedTarget=null;
 let cg=document.createElement('div');cg.className='choice-grid';
 market.forEach((c,i)=>{let b=card(c,1,true);b.classList.add('selectable-card');b.setAttribute('aria-label','公開カード '+(i+1)+'：'+c.name+' を選択');b.onclick=()=>{selectedTarget={kind:'market',index:i};[...cg.children].forEach(x=>{x.classList.remove('selected');x.setAttribute('aria-pressed','false')});b.classList.add('selected');b.setAttribute('aria-pressed','true');renderCandidates()};cg.appendChild(b)});
 legends.forEach((L,i)=>{let b=card({...L,type:'LEGEND',image:resolvedContentImage(L)},1,true);b.classList.add('selectable-card');b.setAttribute('aria-label','レジェンド '+(i+1)+'：'+L.name+' を選択');b.onclick=()=>{selectedTarget={kind:'legend',index:i};[...cg.children].forEach(x=>{x.classList.remove('selected');x.setAttribute('aria-pressed','false')});b.classList.add('selected');b.setAttribute('aria-pressed','true');renderCandidates()};cg.appendChild(b)});
 if(!cg.children.length)current.innerHTML='<div class="muted">公開場・レジェンド置き場にカードがありません。</div>';else current.appendChild(cg);
 function renderCandidates(){
   list.innerHTML='';
   if(!selectedTarget)return;
   let targetCard=selectedTarget.kind==='legend'?legends[selectedTarget.index]:market[selectedTarget.index];
   let guide=document.createElement('div');guide.style.cssText='grid-column:1/-1;padding:10px;background:#fff4b8;border:1px solid #d6b84d;border-radius:8px;font-weight:700';guide.textContent='選択中：'+(targetCard?.name||'不明')+' → 下から入れ替え先のカードを選択してください';list.appendChild(guide);
   let candidates;
   if(selectedTarget.kind==='legend'){
     const target=legends[selectedTarget.index];
     candidates=LEGEND_CATALOG.filter(L=>L.tier===target.tier&&isPackEnabled(L.packId));
   }else{
     candidates=[...STD_BASE,...NORMAL_BASE.filter(c=>c.implemented&&isPackEnabled(c.packId))];
   }
   candidates.forEach(c=>{
     let b=card(c,1,true);b.classList.add('selectable-card');let no=document.createElement('div');no.className='small';no.style.fontWeight='800';no.style.marginBottom='4px';no.textContent='カード番号：'+(c.key||c.id||'');b.insertBefore(no,b.firstChild);let ef=document.createElement('div');ef.className='card-effect-inline';ef.textContent=effectText(c);b.appendChild(ef);b.onclick=()=>{
       if(!selectedTarget)return;
       if(selectedTarget.kind==='market'){
         let idx=selectedTarget.index;if(!market[idx])return;
         market[idx]={...c,id:c.key+'-DBG-MARKET-'+(++debugCardSerial)};
         triggerNotices.push('デバッグ：公開場のカードを「'+c.name+'」に入れ替えました。');
       }else{
         let idx=selectedTarget.index;if(!legends[idx])return;
         const old=legends[idx];
         legends[idx]={...c,col:old.col,tier:old.tier,taken:false,unlocked:old.unlocked};
         triggerNotices.push('デバッグ：レジェンド置き場のカードを「'+c.name+'」に入れ替えました。');
       }
       selectedMarketKey=null;selectedTarget=null;modal.classList.add('hidden');renderGame();
     };list.appendChild(b)
   });
   guide.scrollIntoView({block:'nearest',behavior:'smooth'});
 }
 modal.classList.remove('hidden');
}
function debugAdvanceToNextOwnTurn(){
 if(playerCount<=1){beginTurn();return}
 const startPlayer=turn;
 // 自分の現在ターンも終了し、他プレイヤーのターンを省略してから自分に戻す。
 // 従来は playerCount-1 回しか進めず、相手の手番に留まって特殊獲得が判定されなかった。
 for(let i=0;i<playerCount;i++){
  runInstalledPackHooks('turnEnd',turn);
  runRuleHook('turnEnd',{player:turn});
  dice=[];
  if(temporary[turn].length){installed[turn].push(...temporary[turn]);temporary[turn]=[]}
  refillTo8();
  if(endgameStarter!==null&&turn!==endgameStarter){
   endgameRemaining--;
   if(endgameRemaining<=0){finishGame();return}
  }
  turn=(turn+1)%playerCount;
 }
 if(!gameEnded){
  // オンラインデバッグでは視点と手番を一致させ、獲得ポップアップを表示する。
  if(onlineDebugMode)viewer=startPlayer;
  triggerNotices.push('デバッグ：相手ターンをスキップし、自分の次のターン開始時まで進めました。');
  beginTurn();
  renderGame();
 }
}
function showDebugEraLegendDiagnosis(){
 const ids=['LL8','LL9','LU8','LU9'];
 const all=ids.map(id=>{
  const L=legends.find(x=>x.id===id);
  if(!L)return {id,exists:false};
  const cfg=specialConfig(L);
  const cond=cfg.condition||{};
  return {id,name:L.name,exists:true,tier:L.tier,layoutSet:L.layoutSet,
   taken:!!L.taken,eraBlocked:!!L.eraBlocked,unlocked:!!L.unlocked,
   phase:cfg.phase||'(なし)',specialEffect:specialEffectId(L),condition:cond,
   conditionMet:eraLegendCondition(L),
   offeredAtPre:!L.taken&&!L.eraBlocked&&!!L.unlocked&&cfg.phase==='pre'&&eraLegendCondition(L),
   offeredAtPost:!L.taken&&!L.eraBlocked&&!!L.unlocked&&cfg.phase==='post'&&eraLegendCondition(L)};
 });
 const totalDebt=commandCounts.reduce((a,n)=>a+(n||0),0);
 const pw=powers[turn]||{};
 const report={version:'0.3.236',trace:economyAcquireTrace.slice(),turnPlayer:turn+1,viewerPlayer:viewer+1,
  localDebug:!!debugLocalMode,onlineDebug:!!onlineDebugMode,realOnline:!!realOnlineMainMode,
  legendTakenThisTurn:!!legendTakenThisTurn,depressionLegendLocked:!!depressionLegendLocked(turn),
  money:pw.y||0,food:pw.p||0,military:pw.r||0,
  ownDebt:commandCounts[turn]||0,totalDebt,debtDeckRemaining:komePlace,
  depressionRequiredFoodMilitary:Math.max(0,100-10*(commandCounts[turn]||0)),
  depressionAvailableFoodMilitary:(pw.p||0)+(pw.r||0),
  lowerInstalled:installed.map((cards,i)=>({player:i+1,cards:(cards||[]).filter(c=>c.key==='LL8'||c.key==='LL9').map(c=>c.key)})),
  legends:all};
 let modal=q('#debugEraDiagnosisModal');
 if(!modal){modal=document.createElement('div');modal.id='debugEraDiagnosisModal';modal.className='imgmodal hidden';modal.style.zIndex='10030';document.body.appendChild(modal)}
 modal.innerHTML='';
 const pane=document.createElement('div');pane.style.cssText='background:#fff;color:#222;border-radius:12px;padding:14px;width:94vw;max-width:700px;max-height:85vh;overflow:auto';
 const h=document.createElement('strong');h.textContent='金融レジェンド獲得診断';pane.appendChild(h);
 const note=document.createElement('div');note.className='small';note.textContent='現在の内部状態を表示します。判定やカード状態は変更しません。';pane.appendChild(note);
 const pre=document.createElement('pre');pre.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px';pre.textContent=JSON.stringify(report,null,2);pane.appendChild(pre);
 const close=document.createElement('button');close.className='secondary';close.textContent='閉じる';close.onclick=()=>modal.classList.add('hidden');
 const copy=document.createElement('button');copy.className='secondary';copy.style.marginLeft='8px';copy.textContent='診断結果をコピー';copy.onclick=()=>{const value=JSON.stringify(report,null,2);if(navigator.clipboard?.writeText){navigator.clipboard.writeText(value).then(()=>{copy.textContent='コピーしました'}).catch(()=>turnClockPrompt('診断結果をコピーしてください',value))}else turnClockPrompt('診断結果をコピーしてください',value)};
 pane.append(close,copy);modal.appendChild(pane);modal.classList.remove('hidden');
}
function renderDebugActions(){
 let box=q('#debugactions');if(!box)return;box.innerHTML='';
 let diag=document.createElement('button');diag.className='secondary';diag.textContent='金融レジェンド獲得診断';diag.onclick=showDebugEraLegendDiagnosis;box.appendChild(diag);
 let resetMarket=document.createElement('button');resetMarket.className='secondary';resetMarket.textContent='最初のカード配置前に戻して再配置';resetMarket.onclick=debugResetToInitialMarketPlacement;box.appendChild(resetMarket);
 let replaceMarket=document.createElement('button');replaceMarket.className='secondary';replaceMarket.style.marginLeft='6px';replaceMarket.textContent='公開カードを入れ替える';replaceMarket.onclick=showDebugMarketReplace;box.appendChild(replaceMarket);
 let skipOpp=document.createElement('button');skipOpp.className='secondary';skipOpp.style.marginLeft='6px';skipOpp.textContent='相手ターン終了後まで進める';skipOpp.onclick=debugAdvanceToNextOwnTurn;box.appendChild(skipOpp);
 let create=document.createElement('button');create.className='secondary';create.textContent='カードを無から生成';create.onclick=showDebugCardCreator;box.appendChild(create);
 let deckView=document.createElement('button');deckView.className='secondary';deckView.style.marginLeft='6px';deckView.textContent='山札の内容を確認';deckView.onclick=showDebugDeckContents;box.appendChild(deckView);
 let roll=document.createElement('button');roll.className='secondary';roll.style.marginLeft='6px';roll.textContent='サイコロを振る';roll.onclick=beginTurn;box.appendChild(roll);
 let hire=document.createElement('div');hire.style.margin='8px 0 5px';let hs=document.createElement('select');let debugRarityOrder={N:0,R:1,SR:2,SSR:3,UR:4,CLR:5};Object.values(CAST_TYPES).filter(e=>isPackEnabled(e.packId)).sort((a,b)=>(debugRarityOrder[a.rarity]??99)-(debugRarityOrder[b.rarity]??99)||castDisplayName(a).localeCompare(castDisplayName(b),'ja')).forEach(e=>{let o=document.createElement('option');o.value=e.id;o.textContent=(e.rarity==='CLR'?'LR':e.rarity)+' '+castDisplayName(e);hs.appendChild(o)});let hb=document.createElement('button');hb.className='secondary';hb.textContent='指名雇用';hb.disabled=(employees[turn]||[]).length>=effectiveHireLimit();hb.onclick=()=>debugNamedHire(hs.value);hire.append('人材 ',hs,' ',hb);box.appendChild(hire);
 let order=document.createElement('div');order.style.margin='5px 0';let os=document.createElement('select');for(let v=1;v<=6;v++){let o=document.createElement('option');o.value=v;o.textContent='命令書 '+v;os.appendChild(o)}let ob=document.createElement('button');ob.className='secondary';ob.textContent='獲得';ob.onclick=()=>debugGainOrder(os.value);order.append(os,' ',ob);box.appendChild(order);
 let debt=document.createElement('div');debt.style.margin='5px 0';let dl=document.createElement('span');dl.textContent='負債 ';debt.appendChild(dl);
 [['自分が+1','self'],['全員が+1','all'],['自分以外が+1','others']].forEach(([label,mode],i)=>{let b=document.createElement('button');b.className='secondary';if(i)b.style.marginLeft='6px';b.textContent=label;b.onclick=()=>debugGainDebt(mode);debt.appendChild(b)});box.appendChild(debt);
 let vp=document.createElement('button');vp.className='secondary';vp.textContent='+20VP';vp.onclick=()=>{debugVP[turn]=(debugVP[turn]||0)+20;renderGame()};
 let tok=document.createElement('button');tok.className='secondary';tok.style.marginLeft='6px';tok.textContent='資金・食料・兵力 +10ずつ';tok.onclick=()=>{powers[turn].y+=10;powers[turn].p+=10;powers[turn].r+=10;renderGame()};box.append(vp,tok);
}
let dialogLog=[];
function addDialog(message){
 if(!message)return;
 let safeMessage=String(message);
 if(botMatchMode&&botIsPlayer(turn)&&/ドロー|引きました|命令書|山札から|手札に加え/.test(safeMessage))safeMessage=safeMessage.replace(/「[^」]*」(?:「[^」]*」)*/g,'（非公開）');
 dialogLog.push({turn:turn+1,message:safeMessage});
 let c=q('#dialogLogCount');if(c)c.textContent=dialogLog.length;
}
// @kokoryo-end-section S0077

// @kokoryo-section S0115


// Ver.0.3.163: ローカルプレイログ。認証情報や入力文字列は保存しない。
const PLAYLOG_VERSION='1.2';
let playLogEvents=[],playLogStart=new Date().toISOString(),playLogLastState=null,playLogTurnSerial=0;
function playLogCard(c){return c?{id:String(c.key||c.id||''),name:String(c.name||''),packId:String(c.packId||'base')}:null}
function playLogCards(list){return (list||[]).map(playLogCard)}

// ターン終了時の通常カード枚数監査。カード種別ごとの初期枚数を基準に全領域を照合する。
let normalCardAuditBaseline=null;
function normalCardAuditInventory(){
 const zones={deck:deck||[],market:market||[],discard:discard||[]};
 (hands||[]).forEach((a,i)=>zones['P'+(i+1)+'_hand']=a||[]);
 (installed||[]).forEach((a,i)=>zones['P'+(i+1)+'_installed']=a||[]);
 (temporary||[]).forEach((a,i)=>zones['P'+(i+1)+'_temporary']=a||[]);
 // ドラフト中に残ったカードも監査対象にする（通常対戦開始後は山札へ移動済み）。
 const counts={},locations={},zoneTotals={};
 for(const [zone,cards] of Object.entries(zones)){
  zoneTotals[zone]=0;
  for(const c of cards){if(!c||!c.key||c.tier==='lower'||c.tier==='upper')continue;
   const key=String(c.key);counts[key]=(counts[key]||0)+1;
   (locations[key]??={})[zone]=((locations[key]||{})[zone]||0)+1;
   zoneTotals[zone]++;
  }
 }
 return {counts,locations,zoneTotals,total:Object.values(counts).reduce((a,b)=>a+b,0)};
}
function resetNormalCardAudit(){normalCardAuditBaseline=normalCardAuditInventory().counts;}
function logNormalCardAudit(stage){
 try{
  const current=normalCardAuditInventory();
  if(!normalCardAuditBaseline){playLogEvent('normal_card_audit',{stage,status:'baseline_missing',currentTotal:current.total,zoneTotals:current.zoneTotals});return;}
  const differences=[];
  for(const key of new Set([...Object.keys(normalCardAuditBaseline),...Object.keys(current.counts)])){
   const expected=normalCardAuditBaseline[key]||0,actual=current.counts[key]||0;
   if(expected!==actual)differences.push({id:key,expected,actual,difference:actual-expected,locations:current.locations[key]||{}});
  }
  const expectedTotal=Object.values(normalCardAuditBaseline).reduce((a,b)=>a+b,0);
  playLogEvent('normal_card_audit',{stage,status:differences.length?'mismatch':'ok',expectedTotal,actualTotal:current.total,zoneTotals:current.zoneTotals,differences});
 }catch(e){playLogEvent('normal_card_audit_error',{stage,message:String(e?.message||e)})}
}
function playLogCharacter(p){
 const id=typeof charOf==='function'?charOf(p):characters?.[p];
 const c=CHARACTER_DATA[id]||{};
 const sel=(typeof onlineCharSelections!=='undefined'&&onlineCharSelections?.[p])||null;
 return {id:String(id||''),name:String(c.name||''),familyId:String(sel?.familyId||''),versionId:String(sel?.versionId||'')};
}
function playLogAction(type,detail={}){playLogEvent(type,{player:turn+1,...detail})}
function playLogSnapshot(){
 const n=Math.max(0,Math.min(6,playerCount||0));
 return {turn:turn+1,round:round+1,gameEnded:!!gameEnded,botMatch:!!botMatchMode,
  players:Array.from({length:n},(_,p)=>({player:p+1,bot:!!(botMatchMode&&botIsPlayer(p)),character:playLogCharacter(p),vp:totalVP(p),resources:{...(powers[p]||{})},hand:playLogCards(hands[p]),commands:(breadHands[p]||[]).map(x=>({order:x.order??x.value??null})),debt:commandCounts[p]||0,installed:playLogCards(installed[p]),temporary:playLogCards(temporary[p]),employees:(employees[p]||[]).map(x=>({id:String(x?.id||x?.key||''),name:String(x?.name||'')}))})),
  dice:(dice||[]).map(x=>({id:x.id,value:x.value,used:!!x.used})),market:playLogCards(market),legends:(legends||[]).map(x=>({id:String(x.id||x.key||''),name:x.name,taken:!!x.taken,unlocked:!!x.unlocked})),deckRemaining:deck.length,discardCount:discard.length,pendingParkPlayers:[...(pendingParkPlayers||[])].map(x=>x+1)};
}
function playLogEvent(type,detail={},snapshot=false){
 try{const e={at:new Date().toISOString(),type,turn:turn+1,detail};if(snapshot)e.state=playLogSnapshot();playLogEvents.push(e);if(playLogEvents.length>15000)playLogEvents.splice(0,1000)}catch(_){/* ログの失敗でゲームを止めない */}
}
function playLogReset(){playLogEvents=[];playLogStart=new Date().toISOString();playLogTurnSerial=0;playLogLastState=null;playLogEvent('game_initialized',{},true)}
function playLogChanges(reason){
 try{const next=playLogSnapshot(),prev=playLogLastState;
  if(prev){for(let p=0;p<next.players.length;p++){
   const a=prev.players[p],b=next.players[p];if(!a||!b)continue;
   const changes={};for(const k of ['character','vp','resources','hand','commands','debt','installed','temporary','employees'])if(JSON.stringify(a[k])!==JSON.stringify(b[k]))changes[k]={before:a[k],after:b[k]};
   if(Object.keys(changes).length)playLogEvent('player_state_change',{player:p+1,reason,changes});
  }
  for(const k of ['dice','market','legends','pendingParkPlayers'])if(JSON.stringify(prev[k])!==JSON.stringify(next[k]))playLogEvent('board_state_change',{field:k,reason,before:prev[k],after:next[k]});
  }
  playLogLastState=next;
 }catch(_){/* ログの失敗でゲームを止めない */}
}
function playLogExport(){
 try{playLogChanges('export');const data={schema:'kokoryo-playlog',schemaVersion:PLAYLOG_VERSION,gameVersion:'0.3.236',startedAt:playLogStart,exportedAt:new Date().toISOString(),finished:!!gameEnded,settings:{deckId:gameSettings.deckId,deckName:activeDeckConfig(gameSettings.deckId)?.name||gameSettings.deckId,winVP:gameSettings.winVP,playerCount,enabledPacks:[...(gameSettings.enabledPacks||[])],enabledRulePacks:[...(gameSettings.enabledRulePacks||[])],activeRules:(gameSettings.activeRuleCards||[]).map(x=>x.id||x.key||''),randomizerEnabled:!!gameSettings.randomizerEnabled,randomizerCount:gameSettings.randomizerCount,deckComposition:(typeof normalCardsForDeck==='function'?normalCardsForDeck(gameSettings.deckId):[]).map(playLogCard)},events:playLogEvents,latestState:playLogSnapshot()};
 const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='kokoryo_playlog_0.3.236_'+new Date().toISOString().replace(/[:.]/g,'-')+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
 }catch(err){console.error('Playlog export error',err);alert('プレイログの保存に失敗しました。')}
}
function playLogDownloadButton(){const b=document.createElement('button');b.type='button';b.className='secondary';b.textContent='プレイログを保存';b.onclick=playLogExport;return b}
window.addEventListener('error',e=>playLogEvent('javascript_error',{message:String(e.message||''),file:(e.filename||'').split('/').pop(),line:e.lineno,column:e.colno},true));
window.addEventListener('unhandledrejection',e=>playLogEvent('promise_error',{message:String(e.reason?.message||e.reason||'').slice(0,500)},true));
// クリックの対象名・入力内容は記録せず、操作後の状態変化のみ記録する。
document.addEventListener('click',e=>{const el=e.target.closest('button');if(!el||el.textContent==='プレイログを保存')return;const action=(el.id||'').slice(0,80);setTimeout(()=>playLogChanges(action||'game_action'),0)},true);
// @kokoryo-end-section S0115

// @kokoryo-section S0124

function enterLocalDebugMode(){
 debugLocalMode=true;
 onlineDebugMode=false;
 updateDebugCommandVisibility();
 const entry=q('#entryScreen'),app=q('#mainApp');
 if(entry)entry.classList.add('hidden');
 if(app)app.classList.remove('entry-locked');
 q('#status').textContent='デバッグモード：ローカルでP1〜P4を操作できます。';
}
// @kokoryo-end-section S0124
