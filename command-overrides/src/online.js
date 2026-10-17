// Editing source only. Build with npm run build; do not load this file directly.
// Section order and the shared private scope are preserved by src/order.json.

// @kokoryo-section S0118

function forceRealOnlineLobbyScreen(){
 resetGameEndState();
 // Ver.3.22: ロビー復帰は各画面の状態に依存させず、表示と進行状態を一括で初期化する。
 realLobbyPhase='lobby';
 realMainRoster=[];
 realOnlineMainMode=false;realOnlineCharacterMode=false;realOnlineDraftMode=false;realOnlineResourceMode=false;
 realMainStarted=false;realDraftState=null;realResourceState=null;realDraftInitSent=false;realResourceInitSent=false;
 realLobbyCharSelection=null;realLobbyCharReady=false;
 q('#game')?.classList.add('hidden');q('#setup')?.classList.add('hidden');q('#draft')?.classList.add('hidden');q('#gamestartsetup')?.classList.add('hidden');
 q('#onlineCharacterScreen')?.classList.add('hidden');q('#onlineDraftScreen')?.classList.add('hidden');q('#onlineResourceScreen')?.classList.add('hidden');
 q('#mainApp')?.classList.add('entry-locked');q('#entryScreen')?.classList.add('hidden');q('#onlineDebugLobby')?.classList.add('hidden');
 q('#onlineRealLobby')?.classList.remove('hidden');
 saveRealOnlineResume();renderRealLobby();
}
async function returnRealOnlineToLobby(){
 if(!isRealLobbyHost())return;
 // 専用イベントを先に送る。phase_change と違い、受信側の現在phaseに関係なく必ず復帰処理を実行する。
 try{if(realLobbyChannel)await realLobbyChannel.send({type:'broadcast',event:'return_lobby',payload:{hostId:realLobbyHostId,nonce:Date.now()}})}catch(e){console.error(e)}
 forceRealOnlineLobbyScreen();
 try{await trackRealLobbyPresence()}catch(e){console.error(e)}
}
async function confirmReturnToLobby(){
 // 終了画面ではゲストもロビー復帰を要求できる。全員の画面遷移はHOSTが同期する。
 if(realOnlineMainMode&&gameEnded&&realLobbyChannel&&realLobbyRoomKey&&!isRealLobbyHost()){
  if(!turnClockConfirm('全員をロビーに戻すようHOSTへ要求します。よろしいですか？'))return;
  try{await realLobbyChannel.send({type:'broadcast',event:'endgame_return_request',payload:{clientId:realLobbyClientId}})}
  catch(e){console.error(e);alert('ロビー復帰の要求を送信できませんでした。')}
  return;
 }
 if(!turnClockConfirm('ロビーに戻ります。本当によろしいですか？'))return;
 // 実オンラインでは画面別の mode フラグではなく、ルーム接続そのものを基準に判定する。
 // これによりキャラ選択・ドラフト・資源選択・メインのどこからでも戻れる。
 if(realLobbyChannel&&realLobbyRoomKey){
  if(!isRealLobbyHost()){
   alert('ロビーへ戻す操作はHOSTのみ行えます。退出する場合は退出操作を使用してください。');
   return;
  }
  await returnRealOnlineToLobby();
  return;
 }
 if(onlineDebugMode)returnOnlineDebugToLobby();
}
function returnOnlineDebugToLobby(){resetGameEndState();q('#game').classList.add('hidden');q('#setup').classList.add('hidden');q('#draft').classList.add('hidden');q('#gamestartsetup').classList.add('hidden');q('#onlineCharacterScreen')?.classList.add('hidden');q('#onlineDraftScreen')?.classList.add('hidden');q('#onlineResourceScreen')?.classList.add('hidden');onlineCharSelections=Array(6).fill(null);onlineCharActivePlayer=0;onlineCharPending=null;onlineDraftPacks=[];onlineDraftHands=[];onlineDraftSelected=[];onlineDraftRound=0;onlineDraftActivePlayer=0;onlineDraftPendingIndex=null;onlineResourceChoices=[];onlineResourceConfirmed=[];onlineResourceActivePlayer=0;q('#onlineDebugLobby')?.classList.remove('hidden');q('#status').textContent='オンライン版テスト';renderOnlineDebugLobby()}
// @kokoryo-end-section S0118

// @kokoryo-section S0125

function captureOnlineDebugLobbyPendingSettings(){
 const lobby=q('#onlineDebugLobby');
 if(!lobby||lobby.classList.contains('hidden'))return;
 const el=q('#onlineDebugRuleWinVP');
 if(el&&el.value.trim()!==''){
  const n=Math.floor(Number(el.value));
  if(Number.isFinite(n)&&n>=1)gameSettings.winVP=n;
 }
}
function renderOnlineDebugLobby(){
 captureOnlineDebugLobbyPendingSettings();
 const lobby=q('#onlineDebugLobby');
 const passLabel=lobby?.querySelector('.lobby-head .small');
 if(passLabel)passLabel.textContent=botMatchMode?'合言葉：オートマタ':'合言葉：オーバークロック';
 const lobbyTitle=lobby?.querySelector('.lobby-head h2');
 if(lobbyTitle)lobbyTitle.textContent=botMatchMode?'BOT戦ロビー':'オンラインテストロビー';
 const lobbyBadge=lobby?.querySelector('.lobby-debug-badge');
 if(lobbyBadge)lobbyBadge.textContent=botMatchMode?'BOT MATCH':'ONLINE DEBUG';
 const grid=q('#onlineLobbyPlayers'); if(!grid)return; grid.innerHTML='';
 for(let i=0;i<6;i++){
  const name=onlineDebugPlayers[i]; const box=document.createElement('div'); box.className='lobby-player '+(name?'':'empty');
  box.innerHTML='<strong>P'+(i+1)+'</strong><div style="margin-top:6px">'+(name?name:'参加待ち')+'</div>';
  grid.appendChild(box);
 }
 const st=q('#onlineLobbyStatus'); if(st)st.textContent=onlineDebugPlayers.length+'/6人参加中。キャラクター選択へ進めます。'; populateOnlineDebugDeckPreset(); fillLegendSlotSelect('#onlineDebugRuleLegendSlots',gameSettings.deckId,gameSettings.legendSlots); [['#onlineDebugRuleWinVP','winVP'],['#onlineDebugRuleMarketTypes','marketTypes'],['#onlineDebugRuleInitialResources','initialResources'],['#onlineDebugRuleHireLimit','hireLimit']].forEach(([sel,key])=>{let el=q(sel);if(el)el.value=gameSettings[key]});let rr=q('#onlineDebugRandomizer'),rc=q('#onlineDebugRandomizerCount');if(rr)rr.checked=!!gameSettings.randomizerEnabled;if(rc){rc.value=gameSettings.randomizerCount;rc.max=implementedNormalCards().length;rc.disabled=false}let pk=q('#onlineDebugPack1');if(pk)pk.checked=gameSettings.enabledPacks.includes('pack1');let pk2=q('#onlineDebugPack2');if(pk2)pk2.checked=gameSettings.enabledPacks.includes('pack2');let rpk=q('#onlineDebugRulesPack1'),rcm=q('#onlineDebugRCMode'),rcc=q('#onlineDebugRCChoice');fillRCSelect('#onlineDebugRCChoice');if(rpk)rpk.checked=gameSettings.enabledRulePacks?.includes('rules_pack1');if(rcm)rcm.value=gameSettings.ruleCardMode||'select';if(rcc){rcc.value=gameSettings.ruleCardChoice||'RC1';rcc.disabled=gameSettings.ruleCardMode==='random'}
 if(botMatchMode)updateBotLobbyRestrictions();
}
let onlineCharActivePlayer=0,onlineCharSelections=Array(6).fill(null),onlineCharPending=null;
function onlineCharacterAbilityText(lord){if(!lord)return '';return abilityTextForEntity(lord)||lord.abilityText||''
}
function onlineFamilyTaken(familyId,exceptPlayer){return onlineCharSelections.some((x,i)=>i!==exceptPlayer&&x&&x.familyId===familyId)}
function renderOnlineCharacterScreen(){
 const pc=q('#onlineCharPlayers'),grid=q('#onlineCharGrid'),opt=q('#onlineCharOptions'),st=q('#onlineCharStatus');
 if(!pc||!grid)return;
 const charData=window.KOKORYO_CHARACTER_DATA||{},families=availableCharacterFamilies();
 pc.innerHTML='';grid.innerHTML='';
 for(let i=0;i<onlineDebugPlayers.length;i++){let sel=onlineCharSelections[i],b=document.createElement('button');b.type='button';b.className='online-char-player'+(i===onlineCharActivePlayer?' active':'')+(sel?' done':'');let lord=sel&&charData[sel.charId];b.innerHTML='<strong>P'+(i+1)+' '+onlineDebugPlayers[i]+'</strong><div class="small" style="margin-top:4px">'+(lord?lord.name+' ／ '+(characterVersion(characterFamily(sel.familyId),sel.versionId)?.label||''):'未選択')+'</div>';b.disabled=botMatchMode&&i!==0;b.onclick=()=>{if(botMatchMode&&i!==0)return;onlineCharActivePlayer=i;onlineCharPending=null;renderOnlineCharacterScreen()};pc.appendChild(b)}
 families.forEach(f=>{let taken=onlineFamilyTaken(f.id,onlineCharActivePlayer),cur=onlineCharSelections[onlineCharActivePlayer],card=document.createElement('button');card.type='button';card.className='online-char-card'+(taken?' taken':'')+(cur&&cur.familyId===f.id?' selected':'');card.disabled=taken;card.innerHTML='<strong style="display:block;font-size:18px">'+f.label+'</strong><div class="small" style="margin-top:6px">'+(taken?'他プレイヤーが選択済み':cur&&cur.familyId===f.id?'選択中：'+(characterVersion(f,cur.versionId)?.label||''):'タップしてバージョン選択')+'</div>';card.onclick=()=>{onlineCharPending={familyId:f.id,versionId:null};renderOnlineCharacterOptions(f)};grid.appendChild(card)});
 if(!onlineCharPending&&opt){opt.classList.add('hidden');opt.innerHTML=''}
 let count=onlineCharSelections.slice(0,onlineDebugPlayers.length).filter(Boolean).length;if(st)st.textContent=count+'/'+onlineDebugPlayers.length+'人選択済み。';let next=q('#onlineCharNext');if(next)next.disabled=botMatchMode?!onlineCharSelections[0]:count!==onlineDebugPlayers.length;
}
function renderOnlineCharacterOptions(f){
 const opt=q('#onlineCharOptions'),charData=window.KOKORYO_CHARACTER_DATA||{};if(!opt)return;opt.classList.remove('hidden');opt.innerHTML='';
 let head=document.createElement('strong');head.textContent=f.label;opt.appendChild(head);
 if(!onlineCharPending||!onlineCharPending.versionId){let note=document.createElement('div');note.className='small';note.style.marginTop='4px';note.textContent='バージョンを選択';opt.appendChild(note);let grid=document.createElement('div');grid.className='online-version-choice-grid';(f.versions||[]).forEach(v=>{let sample=charData[v.male||v.female],b=document.createElement('button');b.type='button';b.className='online-version-choice';b.innerHTML='<strong>'+v.label+'</strong><div class="small">《'+(sample?.uniqueAbility||'')+'》'+abilityStackTag(sample?.uniqueAbility)+'<br>'+(sample?onlineCharacterAbilityText(sample):'')+'</div>';b.onclick=()=>{onlineCharPending={familyId:f.id,versionId:v.id};renderOnlineCharacterOptions(f)};grid.appendChild(b)});opt.appendChild(grid);return}
 let v=characterVersion(f,onlineCharPending.versionId),sample=charData[v?.male||v?.female];let detail=document.createElement('div');detail.className='small';detail.style.cssText='margin-top:6px;line-height:1.5';detail.innerHTML='<strong>'+v.label+'</strong><br>《'+(sample?.uniqueAbility||'')+'》'+abilityStackTag(sample?.uniqueAbility)+'<br>'+(sample?onlineCharacterAbilityText(sample):'');opt.appendChild(detail);let g=document.createElement('div');g.className='online-gender-choice';[['男性',v.male],['女性',v.female]].forEach(([label,id])=>{if(!id||!charData[id])return;let b=document.createElement('button');b.type='button';b.className='secondary';b.textContent=label;b.onclick=()=>{onlineCharSelections[onlineCharActivePlayer]={familyId:f.id,versionId:v.id,charId:id};onlineCharPending=null;if(botMatchMode)botFillCharacters();else renderOnlineCharacterScreen()};g.appendChild(b)});opt.appendChild(g);let back=document.createElement('button');back.type='button';back.className='secondary online-char-back-mini';back.textContent='← バージョン選択へ戻る';back.onclick=()=>{onlineCharPending={familyId:f.id,versionId:null};renderOnlineCharacterOptions(f)};opt.appendChild(back)
}
let onlineDraftPacks=[],onlineDraftHands=[],onlineDraftSelected=[],onlineDraftRound=0,onlineDraftActivePlayer=0,onlineDraftPendingIndex=null;
function startOnlineDraft(){const n=onlineDebugPlayers.length;const draftError=initialDraftSetupError(n);if(draftError)return alert(draftError);playerCount=n;characters=onlineCharSelections.slice(0,n).map(x=>x&&CHARACTER_DATA[x.charId]?x.charId:'P1');characterMode=characters[0]||'P1';let deal=createInitialDraftDeal(n);onlineDraftPacks=deal.packs;unusedStd=deal.unused;onlineDraftHands=Array.from({length:n},()=>[]);onlineDraftSelected=Array(n).fill(false);onlineDraftRound=0;onlineDraftActivePlayer=0;onlineDraftPendingIndex=null;q('#onlineCharacterScreen').classList.add('hidden');q('#onlineDraftScreen').classList.remove('hidden');renderOnlineDraft()}
function renderOnlineDraft(){const n=onlineDebugPlayers.length,p=botMatchMode?0:onlineDraftActivePlayer,cards=q('#onlineDraftCards'),players=q('#onlineDraftPlayers');if(!cards||!players)return;q('#onlineDraftRound').textContent=onlineDraftRound+1;q('#onlineDraftWho').textContent='P'+(p+1)+' '+onlineDebugPlayers[p]+' のドラフト';q('#onlineDraftProgress').textContent=onlineDraftSelected.filter(Boolean).length+'/'+n+'人選択済み';q('#onlineDraftOwned').textContent='獲得済み '+onlineDraftHands[p].length+'/'+INITIAL_DRAFT.picks+'枚：'+(onlineDraftHands[p].map(c=>c.name).join('、')||'なし');cards.innerHTML='';if(onlineDraftSelected[p]){let x=document.createElement('div');x.className='notice';x.style.gridColumn='1/-1';x.textContent='この巡は選択済みです。ほかのプレイヤーの選択を待っています。';cards.appendChild(x)}else onlineDraftPacks[p].forEach((c,i)=>{let b=document.createElement('button');b.type='button';b.className='online-info-card online-draft-card';if(onlineDraftPendingIndex===i)b.classList.add('selected');let cv=card(c,1,false);let ef=document.createElement('div');ef.className='card-effect-inline';ef.replaceChildren(cardInfoSections(c));b.append(cv,ef);b.onclick=()=>{if(botMatchMode&&onlineDraftActivePlayer!==0)return;onlineDraftPendingIndex=i;renderOnlineDraft()};cards.appendChild(b)});let confirm=q('#onlineDraftConfirm');confirm.disabled=onlineDraftSelected[p]||onlineDraftPendingIndex===null||(botMatchMode&&onlineDraftActivePlayer!==0);players.innerHTML='';for(let i=0;i<n;i++){let b=document.createElement('button');b.type='button';b.className='online-char-player'+(i===p?' active':'')+(onlineDraftSelected[i]?' done':'');b.innerHTML='<strong>P'+(i+1)+' '+onlineDebugPlayers[i]+'</strong><div class="small" style="margin-top:4px">獲得 '+onlineDraftHands[i].length+'/'+INITIAL_DRAFT.picks+'・'+(onlineDraftSelected[i]?'選択済み':'未選択')+'</div>';b.disabled=botMatchMode&&i!==0;b.onclick=()=>{if(botMatchMode&&i!==0)return;onlineDraftActivePlayer=i;onlineDraftPendingIndex=null;renderOnlineDraft()};players.appendChild(b)}let st=q('#onlineDraftStatus');if(st)st.textContent=onlineDraftSelected[p]?'このプレイヤーは選択済みです。':'カードを1枚タップしてから確定してください。'}
function confirmOnlineDraftPick(){
 if(botMatchMode){
  if(onlineDraftActivePlayer!==0||onlineDraftSelected[0]||onlineDraftPendingIndex===null||!onlineDraftPacks[0]?.[onlineDraftPendingIndex])return;
  const i=onlineDraftPendingIndex;
  onlineDraftHands[0].push(onlineDraftPacks[0][i]);
  onlineDraftPacks[0].splice(i,1);
  onlineDraftSelected[0]=true;
  onlineDraftPendingIndex=null;
  // BOTの選択は画面の操作プレイヤーを変更せず内部で完了させる。
  queueBotDraft();
  return;
 }
 const p=onlineDraftActivePlayer,i=onlineDraftPendingIndex;
 if(onlineDraftSelected[p]||i===null||!onlineDraftPacks[p]?.[i])return;
 onlineDraftHands[p].push(onlineDraftPacks[p][i]);onlineDraftPacks[p].splice(i,1);onlineDraftSelected[p]=true;onlineDraftPendingIndex=null;
 if(onlineDraftSelected.every(Boolean)){
  if(onlineDraftRound>=INITIAL_DRAFT.picks-1){startOnlineResourceSelection();return}
  let old=onlineDraftPacks.map(x=>[...x]),next=Array.from({length:onlineDebugPlayers.length},()=>[]);
  for(let p=0;p<onlineDebugPlayers.length;p++)next[(p+1)%onlineDebugPlayers.length]=old[p];
  onlineDraftPacks=next;onlineDraftRound++;onlineDraftSelected=Array(onlineDebugPlayers.length).fill(false);onlineDraftActivePlayer=0;renderOnlineDraft();return;
 }
 let n=p;do{n=(n+1)%onlineDebugPlayers.length}while(onlineDraftSelected[n]);onlineDraftActivePlayer=n;renderOnlineDraft();
}
let onlineResourceChoices=[],onlineResourceConfirmed=[],onlineResourceActivePlayer=0;
function syncOnlineDebugRulesFromUI(){
 let num=(sel,key,min)=>{let el=q(sel);if(!el)return;let n=ruleSettingValue(key,el.value);gameSettings[key]=n;el.value=n};
 num('#onlineDebugRuleWinVP','winVP',1);num('#onlineDebugRuleMarketTypes','marketTypes',1);num('#onlineDebugRuleInitialResources','initialResources',0);num('#onlineDebugRuleHireLimit','hireLimit',0);num('#onlineDebugRuleLegendSlots','legendSlots',1);
 let re=q('#onlineDebugRandomizer'),rc=q('#onlineDebugRandomizerCount');if(re)gameSettings.randomizerEnabled=!!re.checked;if(rc){gameSettings.randomizerCount=clampedRandomizerCount(rc.value);rc.value=gameSettings.randomizerCount}
 let packs=[];if(q('#onlineDebugPack1')?.checked)packs.push('pack1');if(q('#onlineDebugPack2')?.checked)packs.push('pack2');gameSettings.enabledPacks=packs;
 gameSettings.enabledRulePacks=q('#onlineDebugRulesPack1')?.checked?['rules_pack1']:[];
 gameSettings.ruleCardMode=q('#onlineDebugRCMode')?.value||'select';gameSettings.ruleCardChoice=q('#onlineDebugRCChoice')?.value||'RC1';
 if(botMatchMode)enforceBotRestrictions();
 syncMarketTargetUI();resolveActiveRuleCards();
}
function prepareOnlineGameState(){
 syncOnlineDebugRulesFromUI();
 let rs=q('#onlineLobbyStatus');if(rs)rs.textContent='適用ルール：勝利'+gameSettings.winVP+'VP／公開'+gameSettings.marketTypes+'種／初期資源'+gameSettings.initialResources+'／雇用上限'+gameSettings.hireLimit+'／下位レジェンド'+gameSettings.legendSlots;
 const n=onlineDebugPlayers.length;playerCount=n;hands=onlineDraftHands.map(x=>[...x]);packs=onlineDraftPacks.map(x=>[...x]);
 powers=Array.from({length:n},()=>({y:0,r:0,p:0}));installed=Array.from({length:n},()=>[]);temporary=Array.from({length:n},()=>[]);elekiterUsed=Array(n).fill(false);commandCounts=Array(n).fill(0);komePlace=100;pendingParkPlayers=[];pendingParkTaken=[];installEffectStack=[];parkChoiceRevision=0;breadDeck=makeBreadDeck();breadDiscard=[];breadHands=Array.from({length:n},()=>[]);employeeDeck=[];employees=Array.from({length:n},()=>[]);lordFirstBreadUsed=Array(n).fill(false);lordOverclockUsed=Array(n).fill(false);pendingOverclockChoices=[];debugVP=Array(n).fill(0);graveyardUsed=Array(n).fill(false);publicMarketUsed=Array(n).fill(false);hiredThisTurn=false;organizationUsed=[];nightEscapePostAvailable=false;nightEscapeResetNext=Array(playerCount).fill(false);fusionUsedThisTurn=false;pendingSSRBonus=0;pendingCastResourceChoices=[];viewer=0;market=[];discard=[];selectedMarketKey=null;marketUndoHistory=[];commandUndoHistory=[];dialogLog=[];turn=0;dice=[];resetGameEndState();
 initLegends();let leftovers=packs.flat(),normalDeck=normalCardsForDeck(gameSettings.deckId);deck=sh([...unusedStd,...leftovers,...normalDeck,...makeRandomizerCards()]);resetNormalCardAudit();
}
function startOnlineResourceSelection(){
 prepareOnlineGameState();const n=onlineDebugPlayers.length;onlineResourceChoices=Array.from({length:n},()=>({y:0,p:0,r:0}));onlineResourceConfirmed=Array(n).fill(false);onlineResourceActivePlayer=0;q('#onlineDraftScreen').classList.add('hidden');q('#onlineResourceScreen').classList.remove('hidden');renderOnlineResourceSelection();
}
function renderOnlineResourceSelection(){
 const n=onlineDebugPlayers.length,p=onlineResourceActivePlayer,v=onlineResourceChoices[p],hand=q('#onlineResourceHand'),choices=q('#onlineResourceChoices'),players=q('#onlineResourcePlayers');if(!hand||!choices||!players)return;const total=v.y+v.p+v.r,remain=gameSettings.initialResources-total,cd=CHARACTER_DATA[characters[p]];
 q('#onlineResourceWho').textContent='P'+(p+1)+' '+onlineDebugPlayers[p]+' ／ '+(cd?cd.name:'');hand.innerHTML='<strong>現在の手札</strong><div class="small">ドラフトで獲得した5枚を確認して資源を選べます。</div>';let hg=document.createElement('div');hg.className='online-resource-card-grid';hands[p].forEach(c=>{let w=document.createElement('div');w.className='online-info-card';let cv=card(c,1,false);let ef=document.createElement('div');ef.className='card-effect-inline';ef.replaceChildren(cardInfoSections(c));w.append(cv,ef);hg.appendChild(w)});hand.appendChild(hg);
 choices.innerHTML='<div><strong>初期資源</strong>　残り <strong>'+remain+'</strong> / '+gameSettings.initialResources+'</div>';let row=document.createElement('div');row.className='turnstart-buttons';row.style.marginTop='9px';[['y','💰 資金'],['p','🍖 食料'],['r','⚔️ 兵力']].forEach(([c,label])=>{let b=document.createElement('button');b.type='button';b.className='secondary';b.textContent=label+' '+v[c];b.disabled=onlineResourceConfirmed[p]||remain<=0;b.onclick=()=>{if(v.y+v.p+v.r<gameSettings.initialResources){v[c]++;renderOnlineResourceSelection()}};row.appendChild(b)});let reset=document.createElement('button');reset.type='button';reset.className='secondary';reset.textContent='選び直す';reset.disabled=onlineResourceConfirmed[p]||total===0;reset.onclick=()=>{onlineResourceChoices[p]={y:0,p:0,r:0};renderOnlineResourceSelection()};row.appendChild(reset);choices.appendChild(row);
 let confirm=q('#onlineResourceConfirm');confirm.disabled=onlineResourceConfirmed[p]||total!==gameSettings.initialResources;confirm.textContent=onlineResourceConfirmed[p]?'確定済み':'この資源配分で確定';players.innerHTML='';for(let i=0;i<n;i++){let x=onlineResourceChoices[i],b=document.createElement('button');b.type='button';b.className='online-char-player'+(i===p?' active':'')+(onlineResourceConfirmed[i]?' done':'');b.innerHTML='<strong>P'+(i+1)+' '+onlineDebugPlayers[i]+'</strong><div class="small" style="margin-top:4px">'+(onlineResourceConfirmed[i]?'確定済み':'未確定')+(i===p?' ／ 資金'+x.y+' 食料'+x.p+' 兵力'+x.r:'')+'</div>';b.onclick=()=>{onlineResourceActivePlayer=i;renderOnlineResourceSelection();if(botMatchMode)queueBotResources()};players.appendChild(b)}q('#onlineResourceStatus').textContent=onlineResourceConfirmed.filter(Boolean).length+'/'+n+'人確定済み。';
}
function confirmOnlineResources(){const p=onlineResourceActivePlayer,v=onlineResourceChoices[p];if(onlineResourceConfirmed[p]||v.y+v.p+v.r!==gameSettings.initialResources)return;onlineResourceConfirmed[p]=true;if(onlineResourceConfirmed.every(Boolean)){for(let i=0;i<playerCount;i++)powers[i]={...onlineResourceChoices[i]};resolveGameStartCharacterEffects();saveDebugInitialMarketSnapshot();refillTo8();q('#onlineResourceScreen').classList.add('hidden');let app=q('#mainApp');if(app)app.classList.remove('entry-locked');q('#setup').classList.add('hidden');q('#draft').classList.add('hidden');q('#gamestartsetup').classList.add('hidden');q('#game').classList.remove('hidden');q('#status').textContent='ゲーム開始時処理完了。勝利条件 '+gameSettings.winVP+'VP。オープンマーケットを公開しました。';q('#start').textContent='ゲーム開始';q('#start').style.display='none';turn=chooseFirstPlayer();if(onlineDebugMode&&!realOnlineMainMode&&!botMatchMode)viewer=turn;beginTurn();if(botMatchMode)queueBotTurn();return}let i=p;do{i=(i+1)%playerCount}while(onlineResourceConfirmed[i]);onlineResourceActivePlayer=i;renderOnlineResourceSelection()}
function autoCompleteOnlineDebugSetup(){
 const n=onlineDebugPlayers.length;if(!n)return;
 // 指定の巡数を自動ドラフト。各Pはその時点の候補からランダムに1枚獲得し、残りを次へ渡す。
 for(let round=0;round<INITIAL_DRAFT.picks;round++){
  for(let p=0;p<n;p++){let pack=onlineDraftPacks[p];if(pack&&pack.length){let i=Math.floor(Math.random()*pack.length);onlineDraftHands[p].push(pack.splice(i,1)[0])}}
  if(round<INITIAL_DRAFT.picks-1){let old=onlineDraftPacks.map(x=>[...x]),next=Array.from({length:n},()=>[]);for(let p=0;p<n;p++)next[(p+1)%n]=old[p];onlineDraftPacks=next}
 }
 startOnlineResourceSelection();
 // 初期資源もテスト用に自動配分する。合計値だけ通常ルールと同じにする。
 for(let p=0;p<n;p++){let v={y:0,p:0,r:0},keys=['y','p','r'];for(let k=0;k<gameSettings.initialResources;k++)v[keys[Math.floor(Math.random()*3)]]++;onlineResourceChoices[p]=v}
 onlineResourceConfirmed=Array(n).fill(false);onlineResourceActivePlayer=0;
 while(!onlineResourceConfirmed.every(Boolean)){confirmOnlineResources()}
}
function openOnlineCharacterScreen(){if(!onlineDebugPlayers.length)return;syncOnlineDebugRulesFromUI();realOnlineCharacterMode=false;const sub=q('#onlineCharSub'),badge=q('#onlineCharBadge'),notice=q('#onlineCharNotice'),dbg=q('#onlineCharDebugSwitch');if(sub)sub.textContent='オンライン共有画面テスト';if(badge){badge.textContent='ONLINE DEBUG';badge.style.background='#222'}if(notice)notice.textContent='各プレイヤーの選択状況は全員に共有される想定です。デバッグでは画面下部で操作するPを切り替えて1人で確認できます。';if(dbg)dbg.style.display='block';onlineCharSelections=onlineCharSelections.slice(0,onlineDebugPlayers.length);while(onlineCharSelections.length<6)onlineCharSelections.push(null);onlineCharActivePlayer=0;onlineCharPending=null;q('#onlineDebugLobby').classList.add('hidden');q('#onlineCharacterScreen').classList.remove('hidden');renderOnlineCharacterScreen()}
function closeOnlineCharacterScreen(){q('#onlineCharacterScreen').classList.add('hidden');q('#onlineDebugLobby').classList.remove('hidden');renderOnlineDebugLobby()}
// Ver.3.9: Supabase Realtime Presence を使った実オンラインロビー。
// Presence は接続中の参加者だけを保持するため、ブラウザを閉じた参加者がロビーに残り続けない。
const SUPABASE_URL='https://csiuvadxhgvzvzagdoiv.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_g573mGIyjUALs63lEzuR0g_P5GWorI0';
let sbClient=null,realLobbyChannel=null,realLobbyRoomKey='',realLobbyName='',realLobbyClientId='';
let realOnlineCharacterMode=false,realLobbyCharSelection=null,realLobbyCharReady=false,realLobbyJoinedAt='',realLobbyCharPending=null;
let realOnlineDraftMode=false,realDraftState=null,realDraftPendingIndex=null,realDraftInitSent=false;
let realOnlineResourceMode=false,realResourceState=null,realResourceInitSent=false;
let realOnlineMainMode=false,realMainApplying=false,realMainStarted=false;
let realMainRoster=[];
let realLobbyPhase='lobby',realLobbyHostId='';
let realOnlineDeckId='standard1',realOnlineDeckConfig=null;
let realOnlineDeckName='スタンダード1',realDeckSubmissions={};
let realOnlineRules={...DEFAULT_RULE_SETTINGS,pack1Enabled:false,pack2Enabled:false,rulesPack1Enabled:false,ruleCardMode:'select',ruleCardChoice:'RC1'};
const REAL_SESSION_KEY='kokoryo_online_resume_v36';
function makeOnlineClientId(){
 const k='kokoryo_online_client_v36';
 try{let v=localStorage.getItem(k);if(v)return v;v=(crypto.randomUUID?crypto.randomUUID():'c-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));localStorage.setItem(k,v);return v}catch(e){return 'c-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)}
}
async function makeRoomKey(pass){
 const src='kokoryo-room-v3:'+String(pass||'');
 try{if(globalThis.crypto?.subtle){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(src));return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('').slice(0,32)}}catch(e){}
 let h=2166136261;for(let i=0;i<src.length;i++){h^=src.charCodeAt(i);h=Math.imul(h,16777619)}return 'fallback-'+(h>>>0).toString(16);
}
function saveRealOnlineResume(){
 if(!realLobbyRoomKey||!realLobbyClientId)return;
 try{localStorage.setItem(REAL_SESSION_KEY,JSON.stringify({roomKey:realLobbyRoomKey,name:realLobbyName,clientId:realLobbyClientId,joinedAt:realLobbyJoinedAt,phase:realLobbyPhase,hostId:realLobbyHostId,character:realLobbyCharSelection,charReady:realLobbyCharReady,draftState:realDraftState,resourceState:realResourceState,mainState:(realOnlineMainMode?realMainSnapshot():(()=>{try{const old=JSON.parse(localStorage.getItem(REAL_SESSION_KEY)||'null');return old?.roomKey===realLobbyRoomKey?old.mainState||null:null}catch(e){return null}})()),deckId:realOnlineDeckId,deckName:realOnlineDeckName,deckConfig:realOnlineDeckConfig,rules:realOnlineRules,ts:Date.now()}))}catch(e){}
}
function clearRealOnlineResume(){try{localStorage.removeItem(REAL_SESSION_KEY)}catch(e){}}
function loadRealOnlineResume(){try{return JSON.parse(localStorage.getItem(REAL_SESSION_KEY)||'null')}catch(e){return null}}
function isRealLobbyHost(){return !!realLobbyHostId&&realLobbyHostId===realLobbyClientId}
let realHostReconcilePending=false;
async function reconcileRealLobbyHost(){
 if(realHostReconcilePending||!realLobbyChannel)return;
 const players=flattenLobbyPresence();
 if(!players.length)return;
 if(realLobbyHostId&&players.some(p=>p.client_id===realLobbyHostId))return;
 const nextHost=players[0].client_id;
 realLobbyHostId=nextHost;
 turnClockHostChanged();
 saveRealOnlineResume();
 if(nextHost===realLobbyClientId){
  realHostReconcilePending=true;
  try{
   await trackRealLobbyPresence();
   await realLobbyChannel.send({type:'broadcast',event:'host_change',payload:{hostId:nextHost}});
  }catch(e){console.error(e)}finally{realHostReconcilePending=false}
 }
 if(realOnlineMainMode)renderGame();else if(realOnlineCharacterMode)renderRealOnlineCharacterScreen();else renderRealLobby();
}
function setRealOnlinePhase(phase){
 realLobbyPhase=phase||'lobby';saveRealOnlineResume();
 ['#onlineCharLeaveRoom','#onlineDraftLeaveRoom','#onlineResourceLeaveRoom','#mainLeaveRoom'].forEach(sel=>q(sel)?.classList.toggle('hidden',!realLobbyChannel));
 q('#onlineRealLobby')?.classList.add('hidden');q('#onlineCharacterScreen')?.classList.add('hidden');q('#onlineDraftScreen')?.classList.add('hidden');q('#onlineResourceScreen')?.classList.add('hidden');
 if(realLobbyPhase==='character')openRealOnlineCharacterScreen();else if(realLobbyPhase==='draft'&&realDraftState)applyRealDraftInit(realDraftState);else if(realLobbyPhase==='resource'&&realResourceState)applyRealResourceInit(realResourceState);else if(realLobbyPhase==='main'){let r=loadRealOnlineResume();if(r?.mainState)applyRealMainSnapshot(r.mainState);}else{realLobbyPhase='lobby';realOnlineMainMode=false;realMainStarted=false;q('#game')?.classList.add('hidden');q('#mainApp')?.classList.add('entry-locked');q('#onlineRealLobby')?.classList.remove('hidden');saveRealOnlineResume();renderRealLobby()}
}
async function broadcastRealPhase(phase){realLobbyPhase=phase;saveRealOnlineResume();if(realLobbyChannel)await realLobbyChannel.send({type:'broadcast',event:'phase_change',payload:{phase,hostId:realLobbyHostId}})}
function ensureSupabaseClient(){
 if(sbClient)return sbClient;
 if(!window.supabase?.createClient)throw new Error('Supabaseライブラリを読み込めませんでした。通信状態を確認してください。');
 sbClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 return sbClient;
}
function flattenLobbyPresence(){
 if(!realLobbyChannel)return [];
 const state=realLobbyChannel.presenceState()||{},out=[];
 Object.entries(state).forEach(([key,list])=>(list||[]).forEach(x=>out.push({key,name:String(x.name||'プレイヤー'),joined_at:String(x.joined_at||''),client_id:String(x.client_id||key),character:x.character||null,char_ready:!!x.char_ready,host_id:String(x.host_id||''),phase:String(x.phase||'lobby'),clock_protocol:Number(x.clock_protocol)||0})));
 const seen=new Set();return out.sort((a,b)=>(a.joined_at||'').localeCompare(b.joined_at||'')||a.client_id.localeCompare(b.client_id)).filter(x=>{if(seen.has(x.client_id))return false;seen.add(x.client_id);return true});
}
function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]))}
function setRealLobbyConnection(text,state=''){
 const t=q('#realLobbyConnection'),d=q('#realLobbyDot');if(t)t.textContent=text;if(d)d.className='online-dot'+(state?' '+state:'');
}
async function trackRealLobbyPresence(){
 if(!realLobbyChannel)return;
 await realLobbyChannel.track({clock_protocol:1,name:realLobbyName,client_id:realLobbyClientId,joined_at:realLobbyJoinedAt||new Date().toISOString(),character:realLobbyCharSelection,char_ready:realLobbyCharReady,host_id:realLobbyHostId,phase:realLobbyPhase});saveRealOnlineResume();
}
// Ver.0.3.185: 実オンラインはロビーで選択した追加パックのみを領主候補に含める。
function realAvailableCharacterFamilies(){return availableCharacterFamilies()}
function realCharacterSelectionAllowed(sel){
 if(!sel)return false;
 const family=realAvailableCharacterFamilies().find(f=>f.id===sel.familyId);
 const version=family?.versions?.find(v=>v.id===sel.versionId);
 return !!(version&&sel.charId&&(version.male===sel.charId||version.female===sel.charId));
}
function realFamilyTaken(familyId){return flattenLobbyPresence().some(p=>p.client_id!==realLobbyClientId&&p.character&&p.character.familyId===familyId)}
function realOnlineCharacterDuplicate(players=realLobbyPlayers()){
 const taken=new Set();
 for(const p of players){const f=p.character?.familyId;if(!f)continue;if(taken.has(f))return f;taken.add(f)}
 return null;
}
function renderRealOnlineCharacterScreen(){
 const players=flattenLobbyPresence(),grid=q('#onlineCharGrid'),pc=q('#onlineCharPlayers'),opt=q('#onlineCharOptions'),st=q('#onlineCharStatus');if(!grid||!st)return;
 const families=realAvailableCharacterFamilies(),charData=window.KOKORYO_CHARACTER_DATA||CHARACTER_DATA;if(realLobbyCharSelection&&!realCharacterSelectionAllowed(realLobbyCharSelection)){realLobbyCharSelection=null;realLobbyCharReady=false;realLobbyCharPending=null;trackRealLobbyPresence().catch(console.error)}if(pc)pc.innerHTML='';grid.innerHTML='';
 players.slice(0,6).forEach((p,i)=>{let b=document.createElement('div');b.className='online-char-player'+(p.client_id===realLobbyClientId?' active':'')+(p.character?' done':'');let lord=p.character?charData[p.character.charId]:null;b.innerHTML='<strong>P'+(i+1)+' '+escapeHtml(p.name)+'</strong><div class="small" style="margin-top:4px">'+(lord?escapeHtml(lord.name)+' ／ '+escapeHtml(characterVersion(characterFamily(p.character.familyId),p.character.versionId)?.label||''):'未選択')+(p.char_ready?' ／ 確定済み':'')+'</div>';if(pc)pc.appendChild(b)});
 families.forEach(f=>{const taken=realFamilyTaken(f.id),cur=realLobbyCharSelection,card=document.createElement('button');card.type='button';card.className='online-char-card'+(taken?' taken':'')+(cur&&cur.familyId===f.id?' selected':'');card.disabled=taken||realLobbyCharReady;card.innerHTML='<strong style="display:block;font-size:18px">'+escapeHtml(f.label)+'</strong><div class="small" style="margin-top:6px">'+(taken?'他プレイヤーが選択済み':cur&&cur.familyId===f.id?'選択中：'+escapeHtml(characterVersion(f,cur.versionId)?.label||''):'タップしてバージョン選択')+'</div>';card.onclick=()=>{realLobbyCharPending={familyId:f.id,versionId:null};renderRealOnlineCharacterOptions(f)};grid.appendChild(card)});
 if(!realLobbyCharPending&&opt){opt.classList.add('hidden');opt.innerHTML=''}
 const chosen=realLobbyCharSelection?charData[realLobbyCharSelection.charId]:null,readyCount=players.slice(0,6).filter(p=>p.char_ready).length;st.textContent=chosen?(realLobbyCharReady?'あなたは「'+chosen.name+'」で確定済みです。':'選択中：'+chosen.name+'。確定すると他のプレイヤーに共有されます。'):'キャラクターを選択してください。';const next=q('#onlineCharNext');if(next){next.textContent=realLobbyCharReady?'選択確定済み':'このキャラクターで確定';next.disabled=!realLobbyCharSelection||realLobbyCharReady}const back=q('#onlineCharBack');if(back)back.textContent='ロビーへ戻る';if(players.length&&readyCount===players.length){st.textContent+='　全員の選択が確定しました。ドラフトへ移動します。';setTimeout(()=>maybeStartRealOnlineDraft(),0)}
}
function renderRealOnlineCharacterOptions(f){
 f=realAvailableCharacterFamilies().find(x=>x.id===f?.id);if(!f||realFamilyTaken(f.id)){realLobbyCharPending=null;renderRealOnlineCharacterScreen();return}
 const opt=q('#onlineCharOptions'),charData=window.KOKORYO_CHARACTER_DATA||CHARACTER_DATA;if(!opt)return;opt.classList.remove('hidden');opt.innerHTML='';let head=document.createElement('strong');head.textContent=f.label;opt.appendChild(head);
 if(!realLobbyCharPending||!realLobbyCharPending.versionId){let note=document.createElement('div');note.className='small';note.style.marginTop='4px';note.textContent='バージョンを選択';opt.appendChild(note);let grid=document.createElement('div');grid.className='online-version-choice-grid';(f.versions||[]).forEach(v=>{let sample=charData[v.male||v.female],b=document.createElement('button');b.type='button';b.className='online-version-choice';b.innerHTML='<strong>'+escapeHtml(v.label)+'</strong><div class="small">《'+escapeHtml(sample?.uniqueAbility||'')+'》'+abilityStackTag(sample?.uniqueAbility)+'<br>'+escapeHtml(sample?onlineCharacterAbilityText(sample):'')+'</div>';b.onclick=()=>{if(realFamilyTaken(f.id)){realLobbyCharPending=null;renderRealOnlineCharacterScreen();return}realLobbyCharPending={familyId:f.id,versionId:v.id};renderRealOnlineCharacterOptions(f)};grid.appendChild(b)});opt.appendChild(grid);return}
 let v=characterVersion(f,realLobbyCharPending.versionId),sample=charData[v?.male||v?.female],detail=document.createElement('div');detail.className='small';detail.style.cssText='margin-top:6px;line-height:1.5';detail.innerHTML='<strong>'+escapeHtml(v.label)+'</strong><br>《'+escapeHtml(sample?.uniqueAbility||'')+'》'+abilityStackTag(sample?.uniqueAbility)+'<br>'+escapeHtml(sample?onlineCharacterAbilityText(sample):'');opt.appendChild(detail);let g=document.createElement('div');g.className='online-gender-choice';[['男性',v.male],['女性',v.female]].forEach(([label,id])=>{if(!id||!charData[id])return;let b=document.createElement('button');b.type='button';b.className='secondary';b.textContent=label;b.onclick=async()=>{if(realFamilyTaken(f.id)||!realCharacterSelectionAllowed({familyId:f.id,versionId:v.id,charId:id}))return;realLobbyCharSelection={familyId:f.id,versionId:v.id,charId:id};realLobbyCharReady=false;realLobbyCharPending=null;try{await trackRealLobbyPresence()}catch(err){console.error(err)}renderRealOnlineCharacterScreen()};g.appendChild(b)});opt.appendChild(g);let back=document.createElement('button');back.type='button';back.className='secondary online-char-back-mini';back.textContent='← バージョン選択へ戻る';back.onclick=()=>{realLobbyCharPending={familyId:f.id,versionId:null};renderRealOnlineCharacterOptions(f)};opt.appendChild(back)
}

// Ver.3.9: 実オンライン・ドラフト同期。候補表示は本人分だけに限定する。
function realLobbyPlayers(){return flattenLobbyPresence().slice(0,6)}
function realMyPlayerIndex(){
 const roster=realOnlineMainMode&&realMainRoster.length?realMainRoster:(realResourceState?.roster?.length?realResourceState.roster:realDraftState?.roster?.length?realDraftState.roster:realLobbyPlayers());
 return roster.findIndex(x=>x.client_id===realLobbyClientId);
}
function realPlayerName(p){
 return (realOnlineMainMode&&realMainRoster.length?realMainRoster:realLobbyPlayers())[p]?.name||'';
}
function stdCardFromKey(key){return STD_BASE.find(c=>c.key===key)||STD.find(c=>c.key===key)||null}
function makeRealDraftInitialState(){
 const n=realLobbyPlayers().length,deal=createInitialDraftDeal(n),packs=deal.packs.map(cards=>cards.map(c=>c.key));
 return {roster:realLobbyPlayers().map(p=>({client_id:p.client_id,name:p.name,charId:p.character?.charId||'P1'})),round:0,packs,hands:Array.from({length:n},()=>[]),selected:Array(n).fill(false),playerCount:n,deckId:realOnlineDeckId,deckConfig:realOnlineDeckConfig?cloneCustomDeck(realOnlineDeckConfig):null};
}
function applyRealDraftInit(state){
 if(!state||!Array.isArray(state.packs))return;if(state.deckId){realOnlineDeckId=state.deckId;gameSettings.deckId=state.deckId}if(state.deckConfig){realOnlineDeckConfig=cloneCustomDeck(state.deckConfig);customDeck=cloneCustomDeck(state.deckConfig)}realDraftState=JSON.parse(JSON.stringify(state));realDraftPendingIndex=null;realOnlineDraftMode=true;realOnlineCharacterMode=false;realLobbyPhase='draft';saveRealOnlineResume();
 q('#onlineCharacterScreen')?.classList.add('hidden');q('#onlineDraftScreen')?.classList.add('hidden');q('#onlineRealLobby')?.classList.add('hidden');q('#onlineDraftScreen')?.classList.remove('hidden');
 const badge=q('#onlineDraftScreen .lobby-debug-badge');if(badge){badge.textContent='ONLINE';badge.style.background='#176b3a'}
 const dbg=q('#onlineDraftScreen .online-draft-debug');if(dbg)dbg.style.display='none';
 const notice=q('#onlineDraftScreen .notice');if(notice)notice.textContent='自分に配られた候補だけが表示されます。欲しいカードを1枚選び、「このカードを選択」で確定してください。';
 renderRealOnlineDraft();
}
function applyRealDraftPick(payload){
 if(!realDraftState||!payload||+payload.round!==realDraftState.round)return;const p=+payload.playerIndex,i=+payload.cardIndex;if(p<0||p>=realDraftState.playerCount||realDraftState.selected[p]||!realDraftState.packs[p]?.[i])return;
 realDraftState.hands[p].push(realDraftState.packs[p][i]);realDraftState.packs[p].splice(i,1);realDraftState.selected[p]=true;realDraftPendingIndex=null;
 if(realDraftState.selected.every(Boolean)){
  if(realDraftState.round>=INITIAL_DRAFT.picks-1){saveRealOnlineResume();renderRealOnlineDraft();setTimeout(()=>maybeStartRealOnlineResources(),0);return}
  const old=realDraftState.packs.map(x=>[...x]),next=Array.from({length:realDraftState.playerCount},()=>[]);for(let x=0;x<realDraftState.playerCount;x++)next[(x+1)%realDraftState.playerCount]=old[x];
  realDraftState.packs=next;realDraftState.round++;realDraftState.selected=Array(realDraftState.playerCount).fill(false);
 }
 saveRealOnlineResume();renderRealOnlineDraft();
}
async function maybeStartRealOnlineDraft(){
 if(realOnlineDraftMode||realDraftInitSent||!realLobbyChannel)return;const ps=realLobbyPlayers();if(!ps.length||!ps.every(x=>x.char_ready&&x.character))return;if(!isRealLobbyHost())return;
 if(realOnlineCharacterDuplicate(ps)){const st=q('#onlineCharStatus');if(st)st.textContent='同じキャラクターを選択しているプレイヤーがいます。重複を解消してください。';return;}
 const draftError=initialDraftSetupError(ps.length);if(draftError){const st=q('#onlineCharStatus');if(st)st.textContent=draftError;return}
 realDraftInitSent=true;const state=makeRealDraftInitialState();realLobbyPhase='draft';applyRealDraftInit(state);try{await broadcastRealPhase('draft');await realLobbyChannel.send({type:'broadcast',event:'draft_init',payload:{state}})}catch(e){console.error(e);realDraftInitSent=false}
}
function renderRealOnlineDraft(){
 if(!realDraftState)return;const p=realMyPlayerIndex(),ps=realLobbyPlayers(),cards=q('#onlineDraftCards'),confirm=q('#onlineDraftConfirm');if(p<0||!cards)return;
 q('#onlineDraftRound').textContent=realDraftState.round+1;q('#onlineDraftWho').textContent='P'+(p+1)+' '+(realPlayerName(p)||realLobbyName)+' ／ あなたのドラフト';q('#onlineDraftProgress').textContent=realDraftState.selected.filter(Boolean).length+'/'+realDraftState.playerCount+'人選択済み';
 const own=(realDraftState.hands[p]||[]).map(stdCardFromKey).filter(Boolean);let ownedBox=q('#onlineDraftOwned');ownedBox.innerHTML='<strong>獲得済み '+own.length+'/'+INITIAL_DRAFT.picks+'枚</strong>';if(own.length){let og=document.createElement('div');og.className='online-resource-card-grid';og.style.marginTop='7px';own.forEach(c=>{let w=document.createElement('div');w.className='online-info-card';let cv=card(c,1,false),ef=document.createElement('div');ef.className='card-effect-inline';ef.replaceChildren(cardInfoSections(c));w.append(cv,ef);og.appendChild(w)});ownedBox.appendChild(og)}else ownedBox.insertAdjacentHTML('beforeend','<div class="small">まだ獲得していません。</div>');cards.innerHTML='';
 if(realDraftState.selected[p]){let x=document.createElement('div');x.className='notice';x.style.gridColumn='1/-1';x.textContent=realDraftState.round>=INITIAL_DRAFT.picks-1&&realDraftState.selected.every(Boolean)?'ドラフト完了。全員が5枚獲得しました。':'この巡は選択済みです。ほかのプレイヤーの選択を待っています。';cards.appendChild(x)}else (realDraftState.packs[p]||[]).forEach((key,i)=>{let c=stdCardFromKey(key);if(!c)return;let b=document.createElement('button');b.type='button';b.className='online-info-card online-draft-card';if(realDraftPendingIndex===i)b.classList.add('selected');let cv=card(c,1,false);let ef=document.createElement('div');ef.className='card-effect-inline';ef.replaceChildren(cardInfoSections(c));b.append(cv,ef);b.onclick=()=>{realDraftPendingIndex=i;renderRealOnlineDraft()};cards.appendChild(b)});
 if(confirm){confirm.disabled=realDraftState.selected[p]||realDraftPendingIndex===null;confirm.textContent=realDraftState.selected[p]?'選択済み':'このカードを選択'}
 const st=q('#onlineDraftStatus');if(st)st.textContent=realDraftState.round>=INITIAL_DRAFT.picks-1&&realDraftState.selected.every(Boolean)?'ドラフト完了。初期資源選択へ移動します。':realDraftState.selected[p]?'ほかのプレイヤーの選択を待っています。':'カードを1枚タップしてから確定してください。';
}
async function confirmRealOnlineDraftPick(){
 if(!realDraftState)return;const p=realMyPlayerIndex(),i=realDraftPendingIndex;if(p<0||i===null||realDraftState.selected[p]||!realDraftState.packs[p]?.[i])return;const payload={playerIndex:p,cardIndex:i,round:realDraftState.round};applyRealDraftPick(payload);try{await realLobbyChannel.send({type:'broadcast',event:'draft_pick',payload})}catch(e){console.error(e)}
}

// Ver.3.9: 実オンライン・初期資源選択同期。
function makeRealResourceInitialState(){
 const n=realDraftState?.playerCount||realLobbyPlayers().length;
 return {roster:(realDraftState?.roster||realLobbyPlayers()).map(p=>({client_id:p.client_id,name:p.name,charId:p.charId||p.character?.charId||'P1'})),choices:Array.from({length:n},()=>({y:0,p:0,r:0})),confirmed:Array(n).fill(false),playerCount:n,hands:(realDraftState?.hands||[]).map(x=>[...x])};
}
function applyRealResourceInit(state){
 if(!state||!Array.isArray(state.choices))return;realResourceState=JSON.parse(JSON.stringify(state));realOnlineResourceMode=true;realOnlineDraftMode=false;realLobbyPhase='resource';saveRealOnlineResume();
 q('#onlineDraftScreen')?.classList.add('hidden');q('#onlineCharacterScreen')?.classList.add('hidden');q('#onlineRealLobby')?.classList.add('hidden');q('#onlineResourceScreen')?.classList.remove('hidden');
 const badge=q('#onlineResourceScreen .lobby-debug-badge');if(badge){badge.textContent='ONLINE';badge.style.background='#176b3a'}
 const dbg=q('#onlineResourceScreen .online-resource-debug');if(dbg)dbg.style.display='none';
 const notice=q('#onlineResourceScreen .notice');if(notice)notice.textContent='ドラフトで獲得した自分の5枚を確認し、資金・食料・兵力を合計'+gameSettings.initialResources+'個選んでください。';
 renderRealOnlineResources();
}
async function maybeStartRealOnlineResources(){
 if(realOnlineResourceMode||realResourceInitSent||!realLobbyChannel||!realDraftState)return;
 if(!(realDraftState.round>=INITIAL_DRAFT.picks-1&&realDraftState.selected.every(Boolean))||!isRealLobbyHost())return;
 realResourceInitSent=true;const state=makeRealResourceInitialState();realLobbyPhase='resource';applyRealResourceInit(state);
 try{await broadcastRealPhase('resource');await realLobbyChannel.send({type:'broadcast',event:'resource_init',payload:{state}})}catch(e){console.error(e);realResourceInitSent=false}
}
function renderRealOnlineResources(){
 if(!realResourceState)return;const p=realMyPlayerIndex(),ps=realLobbyPlayers();if(p<0)return;
 const v=realResourceState.choices[p]||{y:0,p:0,r:0},total=v.y+v.p+v.r,remain=gameSettings.initialResources-total;
 const hand=q('#onlineResourceHand'),choices=q('#onlineResourceChoices'),confirm=q('#onlineResourceConfirm');if(!hand||!choices)return;
 q('#onlineResourceWho').textContent='P'+(p+1)+' '+(realPlayerName(p)||realLobbyName)+' ／ あなたの初期資源';
 hand.innerHTML='<strong>現在の手札</strong><div class="small">ドラフトで獲得した5枚を確認して資源を選べます。</div>';
 let hg=document.createElement('div');hg.className='online-resource-card-grid';(realResourceState.hands[p]||[]).map(stdCardFromKey).filter(Boolean).forEach(c=>{let w=document.createElement('div');w.className='online-info-card';let cv=card(c,1,false);let ef=document.createElement('div');ef.className='card-effect-inline';ef.replaceChildren(cardInfoSections(c));w.append(cv,ef);hg.appendChild(w)});hand.appendChild(hg);
 choices.innerHTML='<div><strong>初期資源</strong>　残り <strong>'+remain+'</strong> / '+gameSettings.initialResources+'</div>';let row=document.createElement('div');row.className='turnstart-buttons';row.style.marginTop='9px';
 [['y','💰 資金'],['p','🍖 食料'],['r','⚔️ 兵力']].forEach(([c,label])=>{let b=document.createElement('button');b.type='button';b.className='secondary';b.textContent=label+' '+v[c];b.disabled=realResourceState.confirmed[p]||remain<=0;b.onclick=()=>{if(realResourceState.confirmed[p]||v.y+v.p+v.r>=gameSettings.initialResources)return;v[c]++;saveRealOnlineResume();renderRealOnlineResources()};row.appendChild(b)});
 let reset=document.createElement('button');reset.type='button';reset.className='secondary';reset.textContent='選び直す';reset.disabled=realResourceState.confirmed[p]||total===0;reset.onclick=()=>{realResourceState.choices[p]={y:0,p:0,r:0};saveRealOnlineResume();renderRealOnlineResources()};row.appendChild(reset);choices.appendChild(row);
 if(confirm){confirm.disabled=realResourceState.confirmed[p]||total!==gameSettings.initialResources;confirm.textContent=realResourceState.confirmed[p]?'確定済み':'この資源配分で確定'}
 const done=realResourceState.confirmed.filter(Boolean).length,st=q('#onlineResourceStatus');if(st)st.textContent=done+'/'+realResourceState.playerCount+'人確定済み。'+(done===realResourceState.playerCount?' 全員の初期資源が確定しました。次はメインゲーム同期です。':'');
}
function applyRealResourceConfirm(payload){
 if(!realResourceState||!payload)return;const p=+payload.playerIndex;if(p<0||p>=realResourceState.playerCount||realResourceState.confirmed[p])return;const v=payload.choice||{},choice={y:+v.y||0,p:+v.p||0,r:+v.r||0};if(choice.y+choice.p+choice.r!==gameSettings.initialResources)return;realResourceState.choices[p]=choice;realResourceState.confirmed[p]=true;saveRealOnlineResume();renderRealOnlineResources();if(realResourceState.confirmed.every(Boolean))setTimeout(()=>maybeStartRealOnlineMain(),0);
}
async function confirmRealOnlineResources(){
 if(!realResourceState)return;const p=realMyPlayerIndex(),v=realResourceState.choices[p];if(p<0||realResourceState.confirmed[p]||!v||v.y+v.p+v.r!==gameSettings.initialResources)return;const payload={playerIndex:p,choice:{...v}};applyRealResourceConfirm(payload);try{await realLobbyChannel.send({type:'broadcast',event:'resource_confirm',payload})}catch(e){console.error(e)}
}

// Ver.3.11: 実オンライン・メインゲーム同期。
function realMainSnapshot(){
 return {turnClock:turnClockSnapshot(),turnClockStartPending,turnClockChoice,turnStartPostPending,depressionStartSuppressed,lordOracleUsed,lordTributeUsed,stdAbilityUsed,nextHireMinRarity,nextHireExtra,realMainRoster:realMainRoster.map((p,i)=>({client_id:p.client_id,name:p.name,charId:characters[i]||p.charId||'P1'})),gameSettings:{...gameSettings,enabledPacks:[...(gameSettings.enabledPacks||[])],enabledRulePacks:[...(gameSettings.enabledRulePacks||[])],activeRuleCards:[...(gameSettings.activeRuleCards||[])]},playerCount,characters,hands,powers,installed,temporary,elekiterUsed,commandCounts,komePlace,pendingParkPlayers,pendingParkTaken,installEffectStack,parkChoiceRevision,breadDeck,breadDiscard,breadHands,employees,lordFirstBreadUsed,lordOverclockUsed,pendingOverclockChoices,graveyardUsed,publicMarketUsed,market,discard,deck,turn,dice,legends,legendTakenThisTurn,endgameStarter,endgameRemaining,gameEnded,pendingLordResource,pendingNanban,pendingTenkuCat,pendingSSRBonus,pendingCastResourceChoices,hiredThisTurn,organizationUsed,fusionUsedThisTurn,nightEscapePostAvailable,nightEscapeResetNext,debugVP,copiedAbility,copiedOracleUsed,copiedTributeUsed,triggerNotices,dialogLog};
}
function applyRealMainSnapshot(st){
 if(!st||!turnClockAcceptSnapshot(st))return;realMainApplying=true;
 if(Array.isArray(st.realMainRoster)&&st.realMainRoster.length)realMainRoster=st.realMainRoster.map((p,i)=>({client_id:String(p.client_id||''),name:String(p.name||''),charId:String(st.characters?.[i]||p.charId||'P1')}));
 if(st.gameSettings){Object.assign(gameSettings,st.gameSettings);gameSettings.enabledPacks=[...(st.gameSettings.enabledPacks||[])];gameSettings.enabledRulePacks=[...(st.gameSettings.enabledRulePacks||[])];gameSettings.activeRuleCards=[...(st.gameSettings.activeRuleCards||[])];syncMarketTargetUI();}
 for(const k of ['turnClockStartPending','turnClockChoice','turnStartPostPending','depressionStartSuppressed','lordOracleUsed','lordTributeUsed','stdAbilityUsed','nextHireMinRarity','nextHireExtra','playerCount','characters','hands','powers','installed','temporary','elekiterUsed','commandCounts','komePlace','pendingParkPlayers','pendingParkTaken','installEffectStack','parkChoiceRevision','breadDeck','breadDiscard','breadHands','employees','lordFirstBreadUsed','lordOverclockUsed','pendingOverclockChoices','graveyardUsed','publicMarketUsed','market','discard','deck','turn','dice','legends','legendTakenThisTurn','endgameStarter','endgameRemaining','gameEnded','pendingLordResource','pendingNanban','pendingTenkuCat','pendingSSRBonus','pendingCastResourceChoices','hiredThisTurn','organizationUsed','fusionUsedThisTurn','nightEscapePostAvailable','nightEscapeResetNext','debugVP','copiedAbility','copiedOracleUsed','copiedTributeUsed','triggerNotices','dialogLog'])if(Object.prototype.hasOwnProperty.call(st,k))eval(k+'=st[k]');
 if(realMainRoster.length===playerCount&&realMainRoster.every(p=>p.charId&&p.charId!=='P1'))characters=realMainRoster.map(p=>p.charId);
 realOnlineMainMode=true;realLobbyPhase='main';viewer=Math.max(0,realMyPlayerIndex());
 q('#onlineResourceScreen')?.classList.add('hidden');q('#onlineDraftScreen')?.classList.add('hidden');q('#onlineCharacterScreen')?.classList.add('hidden');q('#onlineRealLobby')?.classList.add('hidden');q('#mainApp')?.classList.remove('entry-locked');q('#setup')?.classList.add('hidden');q('#draft')?.classList.add('hidden');q('#gamestartsetup')?.classList.add('hidden');q('#game')?.classList.remove('hidden');q('#start').style.display='none';
 renderGame();if(gameEnded){const end=q('#endturn'),reroll=q('#reroll');if(end)end.disabled=true;if(reroll)reroll.disabled=true;}saveRealOnlineResume();realMainApplying=false;turnClockAfterSnapshot();
}
async function broadcastRealMainState(actionOwner=turn){
 if(!realOnlineMainMode||realMainApplying||!realLobbyChannel||turnClockNet?.completing)return;
 if(viewer!==actionOwner)return;
 turnClockPublishAction(false);
}
async function broadcastRealGameFinished(actionOwner){return broadcastRealMainState(actionOwner)}
function prepareRealMainGame(){
 applyRealOnlineRules();resolveActiveRuleCards();
 const n=realResourceState.playerCount;
 const ps=realResourceState.roster?.length===n?realResourceState.roster:realDraftState?.roster?.length===n?realDraftState.roster:realLobbyPlayers();
 realMainRoster=ps.slice(0,n).map(p=>({client_id:p.client_id,name:p.name,charId:p.charId||p.character?.charId||'P1'}));
 playerCount=n;characters=realMainRoster.map(x=>x.charId);characterMode=characters[0]||'P1';hands=(realResourceState.hands||[]).map(a=>a.map(stdCardFromKey).filter(Boolean));packs=Array.from({length:n},()=>[]);powers=realResourceState.choices.map(v=>({...v}));installed=Array.from({length:n},()=>[]);temporary=Array.from({length:n},()=>[]);elekiterUsed=Array(n).fill(false);commandCounts=Array(n).fill(0);komePlace=100;pendingParkPlayers=[];pendingParkTaken=[];installEffectStack=[];parkChoiceRevision=0;breadDeck=makeBreadDeck();breadDiscard=[];breadHands=Array.from({length:n},()=>[]);employeeDeck=[];employees=Array.from({length:n},()=>[]);lordFirstBreadUsed=Array(n).fill(false);lordOverclockUsed=Array(n).fill(false);pendingOverclockChoices=[];debugVP=Array(n).fill(0);graveyardUsed=Array(n).fill(false);publicMarketUsed=Array(n).fill(false);hiredThisTurn=false;organizationUsed=[];nightEscapePostAvailable=false;nightEscapeResetNext=Array(playerCount).fill(false);fusionUsedThisTurn=false;pendingSSRBonus=0;pendingCastResourceChoices=[];market=[];discard=[];selectedMarketKey=null;marketUndoHistory=[];commandUndoHistory=[];dialogLog=[];turn=0;dice=[];resetGameEndState();
 initLegends();let dealt=[...(realDraftState?.hands||[]).flat(),...(realDraftState?.packs||[]).flat()],counts={};dealt.forEach(k=>counts[k]=(counts[k]||0)+1);let unused=STD.filter(c=>{if(counts[c.key]){counts[c.key]--;return false}return true});deck=sh([...unused,...normalCardsForDeck(gameSettings.deckId),...makeRandomizerCards()]);resetNormalCardAudit();saveDebugInitialMarketSnapshot();refillTo8();turn=chooseFirstPlayer();beginTurn();realOnlineMainMode=true;viewer=0;
}
async function maybeStartRealOnlineMain(){
 if(!realResourceState||!realResourceState.confirmed.every(Boolean)||realMainStarted||!isRealLobbyHost())return;
 if(realLobbyPlayers().some(p=>p.clock_protocol!==1)){setRealLobbyConnection('全員が Ver.0.3.226 以降へ再読み込みしてから対戦を開始してください。','error');return}
 realMainStarted=true;
 prepareRealMainGame();
 realLobbyPhase='main';
 viewer=Math.max(0,realMyPlayerIndex());
 // Ver.3.31: HOSTも参加者と同じメイン画面遷移処理を通す。
 // 以前はHOSTだけ資源選択画面が前面に残り、ゲーム自体は開始済みでもメインへ行けなかった。
 turnClockInitializeAuthority();
 const initialState=realMainSnapshot();
 applyRealMainSnapshot(initialState);
 try{
  await broadcastRealPhase('main');
  await realLobbyChannel.send({type:'broadcast',event:'main_init',payload:{state:initialState}});
 }catch(e){console.error(e);realMainStarted=false}
}
// Ver.0.3.216: 相手ターンの閲覧操作とゲーム進行操作を分離する。
// 閲覧専用エリアと公開カード・レジェンドの詳細は許可し、獲得や設置は各操作の権限判定で防ぐ。
document.addEventListener('click',e=>{
 if(!realOnlineMainMode||viewer===turn)return;
 const t=e.target instanceof Element?e.target:null;if(!t||!t.closest('#game'))return;
 if(t.closest('#showHireCardList,#showCardList,#showDiscard,#showDialogLog,#showActiveRules,#mainLeaveRoom,#mainReturnLobby,#opponentTurnView,#finalplayers,#market .card,#legendarea .card,#legends .card'))return;
 e.preventDefault();e.stopImmediatePropagation();
},true);
// メイン画面で現在手番の本人が操作した結果を共有する。モーダル内の選択も同じ仕組みで同期する。
// Ver.3.29: 操作のたびに同期を大量送信しない。短時間の連続クリックを1回にまとめ、同一状態は再送しない。
let realMainBroadcastTimer=null;
// Ver.0.3.163: 操作開始時の手番所有者を保持する。終了後は turn が次の人に変わるため、
// 送信時に viewer===turn を再判定すると、最も重要なターン更新が全員へ送れない。
function scheduleRealMainBroadcast(e){
 if(!realOnlineMainMode||realMainApplying||viewer!==turn)return;
 const t=e?.target instanceof Element?e.target:null;
 if(!t||!t.closest('#game, .imgmodal, #limit'))return;
 const actionOwner=turn;
 clearTimeout(realMainBroadcastTimer);
 realMainBroadcastTimer=setTimeout(async()=>{
  if(!realOnlineMainMode||realMainApplying)return;
  await broadcastRealMainState(actionOwner);
 },0);
}
document.addEventListener('click',scheduleRealMainBroadcast,true);

function openRealOnlineCharacterScreen(){
 if(!realLobbyChannel)return;realOnlineCharacterMode=true;realLobbyCharPending=null;q('#onlineRealLobby')?.classList.add('hidden');q('#onlineCharacterScreen')?.classList.remove('hidden');
 const sub=q('#onlineCharSub'),badge=q('#onlineCharBadge'),notice=q('#onlineCharNotice'),dbg=q('#onlineCharDebugSwitch');if(sub)sub.textContent='オンラインキャラクター選択';if(badge){badge.textContent='ONLINE';badge.style.background='#176b3a'}if(notice)notice.textContent='自分のキャラクターを選択してください。選択状況は同じ部屋の全プレイヤーへリアルタイムで共有されます。';if(dbg)dbg.style.display='none';renderRealOnlineCharacterScreen();
}
function closeRealOnlineCharacterScreen(){realOnlineCharacterMode=false;q('#onlineCharacterScreen')?.classList.add('hidden');q('#onlineRealLobby')?.classList.remove('hidden');renderRealLobby()}
function refreshRealLobbySubmitDeckSelect(){
 const sel=q('#realLobbySubmitDeck');if(!sel)return;const saves=getSavedDecks(),names=Object.keys(saves);sel.innerHTML='';
 if(!names.length){let o=document.createElement('option');o.value='';o.textContent='保存デッキなし';sel.appendChild(o);sel.disabled=true}else{sel.disabled=false;names.forEach(name=>{let o=document.createElement('option');o.value=name;o.textContent=name;sel.appendChild(o)})}
 const btn=q('#realLobbySubmitDeckBtn');if(btn)btn.disabled=!names.length;
}
function saveSharedDeckLocally(sub){
 if(!sub?.name||!sub?.config)return;let saves=getSavedDecks();if(saves[sub.name]&&!turnClockConfirm('「'+sub.name+'」は保存済みです。上書きしますか？'))return;saves[sub.name]=cloneCustomDeck(sub.config);if(putSavedDecks(saves)){refreshRealLobbySubmitDeckSelect();alert('「'+sub.name+'」を保存しました。')}
}
async function submitRealLobbyDeck(){
 const name=q('#realLobbySubmitDeck')?.value,saves=getSavedDecks(),cfg=saves[name];if(!name||!cfg)return alert('提出する保存デッキを選んでください。');
 const sub={ownerId:realLobbyClientId,ownerName:realLobbyName,name,config:cloneCustomDeck(cfg)};realDeckSubmissions[realLobbyClientId]=sub;renderRealLobby();
 if(realLobbyChannel)await realLobbyChannel.send({type:'broadcast',event:'deck_submission',payload:{submission:sub}});
}
async function selectRealLobbyDeck(ownerId){
 if(!isRealLobbyHost())return;if(String(ownerId).startsWith('preset:')){let id=String(ownerId).slice(7);if(!DECK_PRESETS[id])return;realOnlineDeckId=id;realOnlineDeckName=standardDeckName(id);realOnlineDeckConfig=null}else{let sub=realDeckSubmissions[ownerId];if(!sub)return;realOnlineDeckId='custom';realOnlineDeckName=sub.name;realOnlineDeckConfig=cloneCustomDeck(sub.config)}
 gameSettings.deckId=realOnlineDeckId;saveRealOnlineResume();renderRealLobby();if(realLobbyChannel)await realLobbyChannel.send({type:'broadcast',event:'deck_config',payload:{deckId:realOnlineDeckId,deckName:realOnlineDeckName,deckConfig:realOnlineDeckConfig}})
}
function renderRealLobbyDeckCandidates(){
 const root=q('#realLobbyDeckCandidates');if(!root)return;root.innerHTML='';const rows=[...standardDeckPresets().map(d=>({key:d.id,name:d.name,ownerName:'固定デッキ',standard:true})),...Object.values(realDeckSubmissions)];
 rows.forEach(sub=>{let row=document.createElement('div');row.className='row';row.style.cssText='justify-content:space-between;gap:8px;padding:7px 0;border-top:1px solid #ddd';let left=document.createElement('div');let selected=sub.standard?realOnlineDeckId===sub.key:realOnlineDeckId==='custom'&&realOnlineDeckName===sub.name&&realOnlineDeckConfig&&JSON.stringify(realOnlineDeckConfig)===JSON.stringify(sub.config);left.innerHTML='<strong>'+(selected?'✓ ':'')+escapeHtml(sub.name)+'</strong><div class="small">'+escapeHtml(sub.ownerName)+(sub.ownerId===realLobbyClientId?'（あなた）':'')+'</div>';row.appendChild(left);let acts=document.createElement('div');acts.className='row';acts.style.justifyContent='flex-end';if(!sub.standard){let save=document.createElement('button');save.type='button';save.className='secondary';save.textContent='保存';save.onclick=()=>saveSharedDeckLocally(sub);acts.appendChild(save)}if(isRealLobbyHost()){let use=document.createElement('button');use.type='button';use.className=selected?'secondary':'primary';use.textContent=selected?'使用中':'このデッキを使用';use.disabled=selected;use.onclick=()=>selectRealLobbyDeck(sub.standard?'preset:'+sub.key:sub.ownerId);acts.appendChild(use)}row.appendChild(acts);root.appendChild(row)})
}
function applyRealOnlineRules(){
 for(const key of Object.keys(DEFAULT_RULE_SETTINGS)){gameSettings[key]=ruleSettingValue(key,realOnlineRules[key]);realOnlineRules[key]=gameSettings[key]}gameSettings.legendSlots=Math.min(legendSlotMax(realOnlineDeckId),gameSettings.legendSlots);realOnlineRules.legendSlots=gameSettings.legendSlots;gameSettings.randomizerEnabled=!!realOnlineRules.randomizerEnabled;gameSettings.randomizerCount=clampedRandomizerCount(realOnlineRules.randomizerCount);realOnlineRules.randomizerCount=gameSettings.randomizerCount;gameSettings.enabledPacks=[];if(realOnlineRules.pack1Enabled)gameSettings.enabledPacks.push('pack1');if(realOnlineRules.pack2Enabled)gameSettings.enabledPacks.push('pack2');gameSettings.enabledRulePacks=realOnlineRules.rulesPack1Enabled?['rules_pack1']:[];gameSettings.ruleCardMode=realOnlineRules.ruleCardMode||'select';gameSettings.ruleCardChoice=realOnlineRules.ruleCardChoice||'RC1';syncMarketTargetUI();
}
function renderRealLobbyRules(){
 applyRealOnlineRules();const host=isRealLobbyHost(),map=[['#realRuleWinVP','winVP'],['#realRuleMarketTypes','marketTypes'],['#realRuleInitialResources','initialResources'],['#realRuleHireLimit','hireLimit']];fillLegendSlotSelect('#realRuleLegendSlots',realOnlineDeckId,realOnlineRules.legendSlots);let lsel=q('#realRuleLegendSlots');if(lsel)lsel.disabled=!host;
 map.forEach(([sel,key])=>{let el=q(sel);if(!el)return;el.value=realOnlineRules[key];el.disabled=!host});let re=q('#realRuleRandomizer'),rc=q('#realRuleRandomizerCount');if(re){re.checked=!!realOnlineRules.randomizerEnabled;re.disabled=!host}if(rc){rc.value=clampedRandomizerCount(realOnlineRules.randomizerCount);rc.max=implementedNormalCards().length;rc.disabled=!host}let pk=q('#realRulePack1');if(pk){pk.checked=!!realOnlineRules.pack1Enabled;pk.disabled=!host}let pk2=q('#realRulePack2');if(pk2){pk2.checked=!!realOnlineRules.pack2Enabled;pk2.disabled=!host}let rpk=q('#realRuleRulesPack1'),rcm=q('#realRuleRCMode'),rcc=q('#realRuleRCChoice');fillRCSelect('#realRuleRCChoice');if(rpk){rpk.checked=!!realOnlineRules.rulesPack1Enabled;rpk.disabled=!host}if(rcm){rcm.value=realOnlineRules.ruleCardMode||'select';rcm.disabled=!host}if(rcc){rcc.value=realOnlineRules.ruleCardChoice||'RC1';rcc.disabled=!host||(realOnlineRules.ruleCardMode==='random')}let st=q('#realLobbyRulesStatus');if(st)st.textContent=host?'あなたがHOSTです。変更すると全員へ反映されます。':'HOSTが設定中です。';
}
async function changeRealLobbyRule(key,value){
 if(!isRealLobbyHost()||!Object.prototype.hasOwnProperty.call(realOnlineRules,key))return;if(key==='randomizerEnabled'||key==='pack1Enabled'||key==='pack2Enabled'||key==='rulesPack1Enabled')realOnlineRules[key]=!!value;else if(key==='ruleCardMode'||key==='ruleCardChoice')realOnlineRules[key]=String(value);else{let n=Math.floor(Number(value));if(!Number.isFinite(n))return;n=(key==='winVP'||key==='marketTypes')?Math.max(1,n):Math.max(0,n);if(key==='randomizerCount')n=clampedRandomizerCount(n);if(key==='legendSlots')n=Math.min(legendSlotMax(realOnlineDeckId),Math.max(1,n));realOnlineRules[key]=n}applyRealOnlineRules();saveRealOnlineResume();renderRealLobbyRules();if(realLobbyChannel)await realLobbyChannel.send({type:'broadcast',event:'rules_config',payload:{rules:{...realOnlineRules}}});
}
async function broadcastRealRules(){if(isRealLobbyHost()&&realLobbyChannel)await realLobbyChannel.send({type:'broadcast',event:'rules_config',payload:{rules:{...realOnlineRules}}})}
function renderRealLobby(){
 const box=q('#realLobbyPlayers'),status=q('#realLobbyStatus');if(!box)return;
 const players=flattenLobbyPresence();box.innerHTML='';
 if(!realLobbyHostId&&players.length)realLobbyHostId=players.find(x=>x.host_id)?.host_id||players[0].client_id;
 if(players.length&&!players.some(x=>x.client_id===realLobbyHostId))reconcileRealLobbyHost();
 for(let i=0;i<6;i++){let d=document.createElement('div'),p=players[i];d.className='lobby-player'+(p&&p.client_id===realLobbyClientId?' self':'')+(p&&p.client_id===realLobbyHostId?' host':'');if(p){d.innerHTML='<strong>P'+(i+1)+' '+escapeHtml(p.name)+(p.client_id===realLobbyHostId?' <span class="small">HOST</span>':'')+'</strong><div class="small" style="margin-top:4px">'+(p.client_id===realLobbyClientId?'あなた':'接続中')+'</div>';if(isRealLobbyHost()&&p.client_id!==realLobbyClientId){let kb=document.createElement('button');kb.type='button';kb.className='secondary';kb.style.marginTop='7px';kb.textContent='キック';kb.onclick=()=>kickRealLobbyPlayer(p.client_id,p.name);d.appendChild(kb)}}else{d.className+=' empty';d.innerHTML='<strong>P'+(i+1)+'</strong><div class="small" style="margin-top:4px">空き</div>'}box.appendChild(d)}
 const myIndex=players.findIndex(x=>x.client_id===realLobbyClientId),btn=q('#realLobbyCharacterSelect');
 const leaveBtn=q('#leaveRealLobby');if(leaveBtn)leaveBtn.textContent='部屋から退出';
 if(btn){btn.style.display=isRealLobbyHost()?'':'none';btn.disabled=!isRealLobbyHost();}
 if(status)status.textContent=myIndex>=0?(isRealLobbyHost()?'あなたは P'+(myIndex+1)+'／HOSTです。現在 '+players.length+'/6人。':'あなたは P'+(myIndex+1)+' です。現在 '+players.length+'/6人。ホストの開始を待っています。'):'参加情報を同期しています...';
 if(players.length>6&&myIndex>=6){if(status)status.textContent='このルームは6人で満員です。別の合言葉を使用してください。';realLobbyChannel?.untrack().catch(()=>{});setRealLobbyConnection('満員','error')}
 refreshRealLobbySubmitDeckSelect();renderRealLobbyDeckCandidates();renderRealLobbyRules();const deckEdit=q('#realLobbyEditDeck'),deckSt=q('#realLobbyDeckStatus');if(deckEdit)deckEdit.disabled=false;if(deckSt)deckSt.textContent='今回の使用デッキ：'+(realOnlineDeckId==='custom'?realOnlineDeckName:standardDeckName(realOnlineDeckId))+(isRealLobbyHost()?' ／ 候補から選択してください。':' ／ HOSTが最終決定します。');
 saveRealOnlineResume();if(realOnlineCharacterMode)renderRealOnlineCharacterScreen();
}
async function broadcastRealDeckConfig(){renderRealLobby()}
async function sendRealStateSync(){
 if(!realLobbyChannel||!isRealLobbyHost())return;
 const payload={phase:realLobbyPhase,hostId:realLobbyHostId,deckId:realOnlineDeckId,deckName:realOnlineDeckName,deckConfig:realOnlineDeckConfig,rules:realOnlineRules};
 if(realLobbyPhase==='draft')payload.draftState=realDraftState;
 if(realLobbyPhase==='resource')payload.resourceState=realResourceState;
 if(realLobbyPhase==='main'){payload.mainState=realOnlineMainMode?realMainSnapshot():loadRealOnlineResume()?.mainState||null;}
 try{await realLobbyChannel.send({type:'broadcast',event:'state_sync_response',payload})}catch(e){console.error(e)}
}
function applyRealStateSync(payload){
 if(!payload)return;
 if(realOnlineMainMode&&payload.hostId&&payload.hostId!==realLobbyHostId)return;
 if(payload.hostId)realLobbyHostId=payload.hostId;
 if(payload.rules){realOnlineRules={...realOnlineRules,...payload.rules};applyRealOnlineRules()}
 if(payload.deckId){realOnlineDeckId=payload.deckId;realOnlineDeckName=payload.deckName||standardDeckName(payload.deckId);realOnlineDeckConfig=payload.deckConfig?cloneCustomDeck(payload.deckConfig):null;gameSettings.deckId=realOnlineDeckId}
 const phase=payload.phase||'lobby';if(phase==='lobby'&&(realOnlineMainMode||loadRealOnlineResume()?.mainState))return;realLobbyPhase=phase;
 if(phase==='main'&&payload.mainState){realMainStarted=true;applyRealMainSnapshot(payload.mainState)}
 else if(phase==='resource'&&payload.resourceState)applyRealResourceInit(payload.resourceState);
 else if(phase==='draft'&&payload.draftState)applyRealDraftInit(payload.draftState);
 else if(phase==='character')openRealOnlineCharacterScreen();
 else if(phase==='lobby'&&!realOnlineMainMode&&!loadRealOnlineResume()?.mainState)setRealOnlinePhase('lobby');
 saveRealOnlineResume();
}
async function enterRealOnlineLobby(name,pass,resume=null){
 const err=q('#entryError'),join=q('#entryJoin');if(err)err.textContent='';if(join){join.disabled=true;join.classList.add('entry-connecting');join.textContent='接続中...'}
 try{
  const client=ensureSupabaseClient();realLobbyName=name;realLobbyClientId=resume?.clientId||makeOnlineClientId();realLobbyRoomKey=resume?.roomKey||await makeRoomKey(pass);realLobbyCharSelection=resume?.character||null;realLobbyCharReady=!!resume?.charReady;realLobbyCharPending=null;realLobbyJoinedAt=resume?.joinedAt||'';realLobbyPhase=resume?.phase||'lobby';realLobbyHostId=resume?.hostId||'';realOnlineDeckId=resume?.deckId||'standard1';realOnlineDeckName=resume?.deckName||(realOnlineDeckId==='custom'?'カスタムデッキ':'スタンダード1');realOnlineDeckConfig=resume?.deckConfig?cloneCustomDeck(resume.deckConfig):null;if(realOnlineDeckConfig)customDeck=cloneCustomDeck(realOnlineDeckConfig);realOnlineRules={winVP:+resume?.rules?.winVP||20,marketTypes:+resume?.rules?.marketTypes||8,initialResources:Number.isFinite(+resume?.rules?.initialResources)?+resume.rules.initialResources:4,hireLimit:Number.isFinite(+resume?.rules?.hireLimit)?+resume.rules.hireLimit:3,legendSlots:Number.isFinite(+resume?.rules?.legendSlots)?+resume.rules.legendSlots:3,randomizerEnabled:!!resume?.rules?.randomizerEnabled,randomizerCount:clampedRandomizerCount(Number.isFinite(+resume?.rules?.randomizerCount)?+resume.rules.randomizerCount:15),pack1Enabled:!!resume?.rules?.pack1Enabled,pack2Enabled:!!resume?.rules?.pack2Enabled,rulesPack1Enabled:!!resume?.rules?.rulesPack1Enabled,ruleCardMode:resume?.rules?.ruleCardMode||'select',ruleCardChoice:resume?.rules?.ruleCardChoice||'RC1'};applyRealOnlineRules();gameSettings.deckId=realOnlineDeckId;realOnlineCharacterMode=false;realOnlineDraftMode=false;realDraftState=resume?.draftState||null;realDraftPendingIndex=null;realDraftInitSent=false;realOnlineResourceMode=false;realResourceState=resume?.resourceState||null;realResourceInitSent=false;realOnlineMainMode=false;realMainStarted=!!resume?.mainState;
  if(realLobbyChannel){try{await realLobbyChannel.untrack()}catch(e){}try{await client.removeChannel(realLobbyChannel)}catch(e){}realLobbyChannel=null}
  const topic='kokoryo-lobby-'+realLobbyRoomKey;
  realLobbyChannel=client.channel(topic,{config:{presence:{key:realLobbyClientId}}});
  realLobbyChannel.on('presence',{event:'sync'},()=>{reconcileRealLobbyHost();renderRealLobby();if(isRealLobbyHost())setTimeout(()=>broadcastRealRules(),50)});
  realLobbyChannel.on('presence',{event:'join'},()=>{reconcileRealLobbyHost();renderRealLobby()});
  realLobbyChannel.on('presence',{event:'leave'},()=>{reconcileRealLobbyHost();renderRealLobby()});
  realLobbyChannel.on('broadcast',{event:'host_change'},({payload})=>{if(!payload?.hostId)return;realLobbyHostId=payload.hostId;turnClockHostChanged();saveRealOnlineResume();if(realOnlineMainMode)renderGame();else if(realOnlineCharacterMode)renderRealOnlineCharacterScreen();else renderRealLobby()});
  realLobbyChannel.on('broadcast',{event:'room_closed'},()=>{});
  realLobbyChannel.on('broadcast',{event:'player_kicked'},({payload})=>{if(payload?.targetId===realLobbyClientId&&payload?.byHostId===realLobbyHostId)teardownRealOnlineLobby('HOSTによって部屋からキックされました。').catch(console.error)});
  realLobbyChannel.on('broadcast',{event:'phase_change'},({payload})=>{if(payload?.hostId)realLobbyHostId=payload.hostId;if(payload?.phase&&payload.phase!==realLobbyPhase)setRealOnlinePhase(payload.phase);if(payload?.phase==='main'&&!realOnlineMainMode)setTimeout(()=>{realLobbyChannel?.send({type:'broadcast',event:'state_sync_request',payload:{clientId:realLobbyClientId}}).catch(console.error)},180)});
  realLobbyChannel.on('broadcast',{event:'return_lobby'},({payload})=>{if(payload?.hostId&&payload.hostId===realLobbyHostId)forceRealOnlineLobbyScreen()});
  realLobbyChannel.on('broadcast',{event:'endgame_return_request'},({payload})=>{
   if(!isRealLobbyHost()||!realOnlineMainMode||!gameEnded)return;
   if(!flattenLobbyPresence().some(p=>p.client_id===payload?.clientId))return;
   returnRealOnlineToLobby().catch(console.error);
  });
  realLobbyChannel.on('broadcast',{event:'deck_config'},({payload})=>{if(!payload)return;realOnlineDeckId=payload.deckId||'standard1';realOnlineDeckName=payload.deckName||(realOnlineDeckId==='custom'?'カスタムデッキ':standardDeckName(realOnlineDeckId));realOnlineDeckConfig=payload.deckConfig?cloneCustomDeck(payload.deckConfig):null;if(realOnlineDeckConfig)customDeck=cloneCustomDeck(realOnlineDeckConfig);gameSettings.deckId=realOnlineDeckId;saveRealOnlineResume();renderRealLobby()});
  realLobbyChannel.on('broadcast',{event:'rules_config'},({payload})=>{if(!payload?.rules)return;realOnlineRules={...Object.fromEntries(Object.keys(DEFAULT_RULE_SETTINGS).map(key=>[key,ruleSettingValue(key,payload.rules[key])])),randomizerEnabled:!!payload.rules.randomizerEnabled,randomizerCount:clampedRandomizerCount(Number.isFinite(+payload.rules.randomizerCount)?+payload.rules.randomizerCount:15),pack1Enabled:!!payload.rules.pack1Enabled,pack2Enabled:!!payload.rules.pack2Enabled,rulesPack1Enabled:!!payload.rules.rulesPack1Enabled,ruleCardMode:payload.rules.ruleCardMode||'select',ruleCardChoice:payload.rules.ruleCardChoice||'RC1'};applyRealOnlineRules();saveRealOnlineResume();renderRealLobbyRules()});
  realLobbyChannel.on('broadcast',{event:'deck_submission'},({payload})=>{let sub=payload?.submission;if(!sub?.ownerId||!sub?.config)return;realDeckSubmissions[sub.ownerId]={ownerId:sub.ownerId,ownerName:sub.ownerName||'プレイヤー',name:sub.name||'カスタムデッキ',config:cloneCustomDeck(sub.config)};renderRealLobby()});
  realLobbyChannel.on('broadcast',{event:'deck_submission_request'},async()=>{let sub=realDeckSubmissions[realLobbyClientId];if(sub&&realLobbyChannel)await realLobbyChannel.send({type:'broadcast',event:'deck_submission',payload:{submission:sub}})});
  realLobbyChannel.on('broadcast',{event:'draft_init'},({payload})=>{if(!realOnlineDraftMode)applyRealDraftInit(payload?.state)});
  realLobbyChannel.on('broadcast',{event:'draft_pick'},({payload})=>applyRealDraftPick(payload));
  realLobbyChannel.on('broadcast',{event:'resource_init'},({payload})=>{if(!realOnlineResourceMode)applyRealResourceInit(payload?.state)});
  realLobbyChannel.on('broadcast',{event:'resource_confirm'},({payload})=>applyRealResourceConfirm(payload));
  realLobbyChannel.on('broadcast',{event:'main_init'},({payload})=>{realMainStarted=true;applyRealMainSnapshot(payload?.state)});
  realLobbyChannel.on('broadcast',{event:'main_state'},({payload})=>turnClockReceiveState(payload));
  realLobbyChannel.on('broadcast',{event:'clock_action'},({payload})=>turnClockReceiveAction(payload));
  realLobbyChannel.on('broadcast',{event:'clock_pulse'},({payload})=>turnClockReceivePulse(payload));
  realLobbyChannel.on('broadcast',{event:'main_game_finished'},({payload})=>turnClockReceiveState(payload));
  realLobbyChannel.on('broadcast',{event:'park_pick'},({payload})=>turnClockReceivePark(payload));
  realLobbyChannel.on('broadcast',{event:'state_sync_request'},()=>{setTimeout(()=>sendRealStateSync(),Math.min(500,Math.max(0,realMyPlayerIndex())*80))});
  realLobbyChannel.on('broadcast',{event:'state_sync_response'},({payload})=>applyRealStateSync(payload));
  q('#entryScreen')?.classList.add('hidden');q('#onlineRealLobby')?.classList.remove('hidden');
  const label=q('#realLobbyRoomLabel');if(label)label.textContent='同じ合言葉のプレイヤーと接続';setRealLobbyConnection('Supabaseへ接続中...');renderRealLobby();
  await new Promise((resolve,reject)=>{let done=false;const timer=setTimeout(()=>{if(!done){done=true;reject(new Error('接続がタイムアウトしました。'))}},12000);realLobbyChannel.subscribe(async status=>{if(done)return;if(status==='SUBSCRIBED'){try{if(!realLobbyJoinedAt)realLobbyJoinedAt=new Date().toISOString();await trackRealLobbyPresence();await realLobbyChannel.send({type:'broadcast',event:'deck_submission_request',payload:{}});await new Promise(r=>setTimeout(r,180));let ps=flattenLobbyPresence();if(!realLobbyHostId){realLobbyHostId=ps.find(x=>x.host_id)?.host_id||(ps[0]?.client_id||realLobbyClientId);await trackRealLobbyPresence()}const hostPresence=ps.find(x=>x.client_id===realLobbyHostId)||ps[0];if(resume?.mainState)realLobbyPhase='main';else if(hostPresence?.phase&&hostPresence.phase!=='lobby')realLobbyPhase=hostPresence.phase;saveRealOnlineResume();done=true;clearTimeout(timer);setRealLobbyConnection('接続済み','connected');renderRealLobby();try{await realLobbyChannel.send({type:'broadcast',event:'state_sync_request',payload:{clientId:realLobbyClientId}})}catch(e){console.error(e)}if(realLobbyPhase!=='lobby')setTimeout(()=>{if(realLobbyPhase==='main'&&!realOnlineMainMode){const r=loadRealOnlineResume();if(r?.mainState)applyRealMainSnapshot(r.mainState)}else setRealOnlinePhase(realLobbyPhase)},500);resolve()}catch(e){done=true;clearTimeout(timer);reject(e)}}else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'){done=true;clearTimeout(timer);reject(new Error('Realtime接続に失敗しました: '+status))}})});
 }catch(e){console.error(e);if(err)err.textContent='オンライン接続に失敗しました。'+(e?.message?' '+e.message:'');q('#onlineRealLobby')?.classList.add('hidden');q('#entryScreen')?.classList.remove('hidden');setRealLobbyConnection('未接続','error')}
 finally{if(join){join.disabled=false;join.classList.remove('entry-connecting');join.textContent='部屋に入る'}}
}
async function teardownRealOnlineLobby(message=''){
 try{if(realLobbyChannel){await realLobbyChannel.untrack();if(sbClient)await sbClient.removeChannel(realLobbyChannel)}}catch(e){console.warn(e)}
 clearRealOnlineResume();realLobbyChannel=null;realLobbyRoomKey='';realLobbyName='';realLobbyCharSelection=null;realLobbyCharReady=false;realLobbyCharPending=null;realLobbyJoinedAt='';realOnlineCharacterMode=false;realOnlineDraftMode=false;realDraftState=null;realDraftPendingIndex=null;realDraftInitSent=false;realOnlineResourceMode=false;realResourceState=null;realResourceInitSent=false;realOnlineMainMode=false;realMainStarted=false;realMainRoster=[];realLobbyPhase='lobby';realLobbyHostId='';realOnlineDeckId='standard1';realOnlineDeckName='スタンダード1';realOnlineDeckConfig=null;realDeckSubmissions={};
 q('#onlineCharacterScreen')?.classList.add('hidden');q('#onlineDraftScreen')?.classList.add('hidden');q('#onlineResourceScreen')?.classList.add('hidden');q('#game')?.classList.add('hidden');q('#onlineRealLobby')?.classList.add('hidden');q('#mainApp')?.classList.add('entry-locked');q('#entryScreen')?.classList.remove('hidden');const err=q('#entryError');if(err)err.textContent=message;setRealLobbyConnection('未接続');
}
async function leaveRealOnlineLobby(){
 if(!realLobbyChannel)return;
 if(!turnClockConfirm('部屋から退出しますか？'))return;
 const wasHost=isRealLobbyHost();
 if(wasHost){
  const players=flattenLobbyPresence().filter(p=>p.client_id!==realLobbyClientId);
  if(players.length){
   const nextHost=players[0].client_id;
   realLobbyHostId=nextHost;
   try{
    await realLobbyChannel.send({type:'broadcast',event:'host_change',payload:{hostId:nextHost}});
   }catch(e){console.error(e)}
  }
 }
 await teardownRealOnlineLobby();
}
async function kickRealLobbyPlayer(clientId,name){
 if(!isRealLobbyHost()||!clientId||clientId===realLobbyClientId)return;
 if(!turnClockConfirm((name||'このプレイヤー')+'をキックしますか？'))return;
 try{if(realLobbyChannel)await realLobbyChannel.send({type:'broadcast',event:'player_kicked',payload:{targetId:clientId,byHostId:realLobbyClientId}})}catch(e){console.error(e)}
}
// Ver.3.28: リロード時は明示的にuntrackしない。退出ボタン時のみteardownでuntrackする。
// これによりHOSTのリロードを通常退出と誤認してHOST権限を譲渡しない。

function enterOnlineDebugLobby(){
 botMatchMode=false;onlineDebugMode=true; debugLocalMode=false; onlineDebugPlayers=['バレンタイン']; updateDebugCommandVisibility();
 q('#entryScreen')?.classList.add('hidden'); q('#onlineDebugLobby')?.classList.remove('hidden'); renderOnlineDebugLobby();
}
function leaveOnlineDebugLobby(){botMatchMode=false;
 onlineDebugMode=false; onlineDebugPlayers=[]; updateDebugCommandVisibility(); q('#onlineDebugLobby')?.classList.add('hidden'); updateBotLobbyRestrictions(); q('#onlineCharacterScreen')?.classList.add('hidden'); q('#onlineDraftScreen')?.classList.add('hidden'); q('#onlineResourceScreen')?.classList.add('hidden'); q('#entryScreen')?.classList.remove('hidden');
 const err=q('#entryError'); if(err)err.textContent='';
}
// @kokoryo-end-section S0125

// @kokoryo-section S0133


// Realtime is a transport, not a shared server clock. Only the elected room HOST
// commits game states/ends. Guests submit fenced proposals; device timestamps
// never decide another player's deadline. Keep all times in milliseconds.
var turnClockNet=null,turnClockStartPending=false,turnClockChoice=null;
function turnClockResetNet(){turnClockNet=null;turnClockStartPending=false;turnClockChoice=null}
function turnClockNonce(){return globalThis.crypto?.randomUUID?.()||String(Date.now())+'-'+Math.random().toString(36).slice(2)}
function turnClockClone(x){return JSON.parse(JSON.stringify(x))}
function turnClockInitializeAuthority(){
 turnClockNet={match:turnClockNonce(),epoch:turnClockNonce(),host:realLobbyHostId,revision:1,pulse:0,seq:0,seen:{},initial:true,ready:true,waitingEnd:false,completing:false,lastPulse:performance.now(),source:'',ack:0};
}
function turnClockSnapshot(){
 if(!turnClockNet)return null;
 turnClockAccount();
 return {protocol:1,match:turnClockNet.match,epoch:turnClockNet.epoch,host:turnClockNet.host,revision:turnClockNet.revision,pulse:turnClockNet.pulse,
  source:turnClockNet.source,ack:turnClockNet.ack,seen:{...turnClockNet.seen},barrier:turnClockNet.barrier||0,remaining:[...turnClockState.remaining],active:turnClockState.active,token:turnClockState.token,savedAt:Date.now()};
}
function turnClockValidMetadata(c){
 return !!c&&c.protocol===1&&typeof c.match==='string'&&typeof c.epoch==='string'&&c.host===realLobbyHostId&&
  Number.isSafeInteger(c.revision)&&c.revision>=1&&Number.isSafeInteger(c.token)&&
  Array.isArray(c.remaining)&&c.remaining.length>=2&&c.remaining.length<=6&&c.remaining.every(n=>Number.isFinite(n)&&n>=0&&n<=TURN_CLOCK_INITIAL)&&
  (c.active===null||(Number.isInteger(c.active)&&c.active>=0&&c.active<c.remaining.length));
}
function turnClockImport(c){
 const s=turnClockState;
 s.remaining=[...c.remaining];s.active=c.active;s.token=c.token;
 s.mono=performance.now();s.wall=Date.now();s.lastCompleted=-1;s.ending=false;s.expiring=false;s.resolving=false;s.timeoutCommit=null;
}
function turnClockAcceptSnapshot(st){
 if(turnClockNet?.applyingAction)return true;
 const c=st.turnClock;
 if(!turnClockValidMetadata(c)){
  // Never silently run a timed room with an old, un-timed client snapshot.
  if(realLobbyPhase==='main')setRealLobbyConnection('持ち時間対応版へ全員更新し、新しい対戦を開始してください。','error');
  return false;
 }
 if(c.remaining.length!==st.playerCount||(st.gameEnded?c.active!==null:c.active!==st.turn))return false;
 const old=turnClockNet;
 if(old&&realOnlineMainMode&&old.match!==c.match)return false;
 if(old&&old.epoch===c.epoch&&(c.revision<old.revision||(realOnlineMainMode&&c.revision===old.revision&&!old.initial)))return false;
 if(old&&old.host===c.host&&old.epoch!==c.epoch)return false;
 const changed=!old||old.epoch!==c.epoch||turnClockState.token!==c.token;
 if(changed)turnClockCloseChoices();
 turnClockNet={...old,match:c.match,epoch:c.epoch,host:c.host,revision:c.revision,pulse:c.pulse||0,seq:Math.max(old?.seq||0,c.seen?.[realLobbyClientId]||0),seen:{...(c.seen||{})},barrier:c.barrier||0,initial:false,ready:true,waitingEnd:false,completing:false,source:c.source||'',ack:c.ack||0,lastPulse:performance.now()};
 turnClockImport(c);
 // On HOST reload only, account for the time since its own saved checkpoint.
 // A guest's absolute wall clock is never compared with the HOST wall clock.
 if(!old&&isRealLobbyHost()&&c.active!==null&&Number.isFinite(c.savedAt))
  turnClockState.remaining[c.active]=Math.max(0,turnClockState.remaining[c.active]-Math.max(0,Date.now()-c.savedAt));
 return true;
}
function turnClockAfterSnapshot(){
 if(!realOnlineMainMode||!turnClockNet)return;
 if(viewer!==turn)q('#legendChoiceModal')?.classList.add('hidden');
 turnClockRender();turnClockStartOwnTurn();
}
function turnClockRestoreChoice(){
 const choice=turnClockChoice;
 if(!choice||viewer!==turn)return;
 q('#legendChoiceModal')?.classList.add('hidden');
 if(choice.kind==='copy'){
  if(!resolveAbilityCopyLegend(()=>continueBeginTurn())){turnClockChoice=null;continueBeginTurn()}
 }
 else if(choice.kind==='genesis')resolveEggHarp(choice.owner,choice.n);
 else if(choice.kind==='yggdrasil')resolveMayQueen(choice.qn,choice.repeat);
}
function turnClockStartOwnTurn(){
 if(!realOnlineMainMode||!turnClockNet?.ready||turnClockNet.completing||gameEnded||realMyPlayerIndex()!==turn)return;
 if(turnClockStartPending){beginTurn();turnClockPublishAction(false)}
 else if(turnClockChoice&&q('#legendChoiceModal')?.classList.contains('hidden'))turnClockRestoreChoice();
}
function beginTurnForClockTimeout(){
 const completing=turnClockNet.completing;
 turnClockNet.completing=false;
 try{beginTurn()}finally{turnClockNet.completing=completing}
}
function turnClockSend(event,payload){
 if(!realLobbyChannel)return;
 // Channel.send can reject or return a non-ok result (e.g. Safari reconnect).
 Promise.resolve(realLobbyChannel.send({type:'broadcast',event,payload})).then(result=>{
  if(result&&result!=='ok')setRealLobbyConnection('通信待ち：再接続後に状態を確認します。','error');
 }).catch(error=>{console.error('持ち時間同期に失敗',error);setRealLobbyConnection('同期に失敗しました。再接続してください。','error')});
}
function turnClockCommit(source='',ack=0){
 const n=turnClockNet;if(!n||!isRealLobbyHost()||!realOnlineMainMode)return;
 n.revision++;n.pulse++;n.source=source;n.ack=ack;n.waitingEnd=false;
 turnClockSend('main_state',{host:realLobbyClientId,state:turnClockClone(realMainSnapshot())});
 saveRealOnlineResume();
}
function turnClockResendState(){
 if(isRealLobbyHost()&&turnClockNet?.ready)
  turnClockSend('main_state',{host:realLobbyClientId,state:turnClockClone(realMainSnapshot())});
}
function turnClockPublishAction(end){
 const n=turnClockNet;
 if(!realOnlineMainMode||!n?.ready||n.waitingEnd||realMyPlayerIndex()!==turn)return;
 const payload={client:realLobbyClientId,match:n.match,epoch:n.epoch,token:turnClockState.token,revision:n.revision,seq:++n.seq,end:!!end,state:turnClockClone(realMainSnapshot())};
 if(end){n.waitingEnd=true;n.pendingEnd=payload;n.lastRetry=performance.now()}
 if(isRealLobbyHost())turnClockReceiveAction(payload);else turnClockSend('clock_action',payload);
}
function turnClockRequestEnd(){
 if(!turnClockNet?.ready||turnClockNet.waitingEnd||gameEnded)return;
 turnClockPublishAction(true);
}
function turnClockReceiveAction(payload){
 const n=turnClockNet,s=turnClockState;
 if(!isRealLobbyHost()||!realOnlineMainMode||!n?.ready||n.completing||!payload)return;
 if(payload.match!==n.match||payload.epoch!==n.epoch||!realMainRoster.some(p=>p.client_id===payload.client)||!Number.isSafeInteger(payload.seq)||payload.seq<1)return;
 if(payload.token!==s.token||payload.seq<=(n.seen[payload.client]||0)||gameEnded&&(payload.client!==realLobbyClientId||!payload.state?.gameEnded)){
  if(payload.end)turnClockResendState();return;
 }
 if(payload.state?.turn!==turn||payload.client!==realMainRoster[turn]?.client_id)return;
 if((payload.revision||0)<(n.barrier||0)){turnClockResendState();return}
 turnClockAccount();
 if(s.remaining[turn]<=0){turnClockExpire(s.token);return}
 n.seen[payload.client]=payload.seq;
 // Ignore the submitted clock. Only the HOST's monotonic elapsed time is used.
 if(payload.client!==realLobbyClientId){
  n.applyingAction=true;
  try{applyRealMainSnapshot(turnClockClone(payload.state))}finally{n.applyingAction=false}
 }
 if(gameEnded)turnClockStop();
 if(payload.end){
  const oldViewer=viewer;n.completing=true;viewer=turn;
  try{completeEnd()}finally{n.completing=false;viewer=oldViewer}
 }
 renderGame();turnClockCommit(payload.client,payload.seq);turnClockStartOwnTurn();
}
function turnClockRequestPark(player,key){
 const n=turnClockNet;if(!n?.ready||realMyPlayerIndex()!==player)return;
 const payload={client:realLobbyClientId,match:n.match,epoch:n.epoch,token:turnClockState.token,player,key,parkRevision:parkChoiceRevision};
 if(isRealLobbyHost())turnClockReceivePark(payload);else turnClockSend('park_pick',payload);
}
function turnClockReceivePark(payload){
 const n=turnClockNet;if(!isRealLobbyHost()||!realOnlineMainMode||!n?.ready||!payload||n.completing||gameEnded)return;
 if(payload.match!==n.match||payload.epoch!==n.epoch||payload.token!==turnClockState.token||payload.client!==realMainRoster[payload.player]?.client_id)return;
 turnClockAccount();if(turnClockState.remaining[turn]<=0){turnClockExpire(turnClockState.token);return}
 if(payload.parkRevision!==undefined&&payload.parkRevision!==parkChoiceRevision)return;
 if(applyOnlineParkPick(payload.player,payload.key)){turnClockCommit();n.barrier=n.revision}
}
function turnClockReceiveState(payload){
 if(!payload?.state||payload.host!==realLobbyHostId)return;
 const c=payload.state.turnClock,n=turnClockNet;
 if(!turnClockValidMetadata(c))return;
 if(n&&c.match===n.match&&c.epoch===n.epoch){
  if(c.revision<=n.revision)return;
  // Do not overwrite local, not-yet-acknowledged actions with an earlier echo.
  // Ending is never speculative: a new lease is always installed from the HOST.
  if(c.token===turnClockState.token&&c.source===realLobbyClientId){
   n.revision=c.revision;n.pulse=c.pulse;
   if(!n.waitingEnd)turnClockImport(c);
   saveRealOnlineResume();return;
  }
 }
 applyRealMainSnapshot(payload.state);
}
function turnClockReceivePulse(payload){
 const n=turnClockNet,c=payload?.clock;
 if(!n||isRealLobbyHost()||payload.host!==realLobbyHostId||!turnClockValidMetadata(c)||c.match!==n.match)return;
 if(c.epoch!==n.epoch||c.token!==turnClockState.token){
  if(performance.now()-(n.lastSyncRequest??-Infinity)>=1000){n.lastSyncRequest=performance.now();turnClockSend('state_sync_request',{clientId:realLobbyClientId})}
  return;
 }
 if(c.pulse<=n.pulse)return;
 n.pulse=c.pulse;
 // Receipt is anchored to this device's monotonic clock, not HOST Date.now().
 turnClockImport(c);turnClockRender();
}
function turnClockHostChanged(){
 const n=turnClockNet;if(!realOnlineMainMode||!n||n.host===realLobbyHostId)return;
 turnClockAccount();n.waitingEnd=false;
 if(isRealLobbyHost()){
  n.host=realLobbyHostId;n.epoch=turnClockNonce();n.revision=1;n.pulse=0;n.seen={};n.ready=true;
  turnClockCommit();turnClockStartOwnTurn();
 }else n.ready=false;
}
function turnClockNetworkTick(){
 const n=turnClockNet;if(!n)return;
 if(n.host!==realLobbyHostId)turnClockHostChanged();
 if(n.waitingEnd&&n.pendingEnd&&performance.now()-(n.lastRetry||0)>=1000){
  n.lastRetry=performance.now();turnClockSend('clock_action',n.pendingEnd);
 }
 if(!isRealLobbyHost()||!n.ready||gameEnded)return;
 turnClockAccount();
 if(performance.now()-n.lastPulse>=1000){
  n.lastPulse=performance.now();n.pulse++;
  turnClockSend('clock_pulse',{host:realLobbyClientId,clock:turnClockSnapshot()});
  saveRealOnlineResume();
 }
}
// Freeze mutations while the HOST acknowledges an end or changes authority.
document.addEventListener('click',event=>{
 if(!realOnlineMainMode||!turnClockNet||turnClockState.resolving)return;
 if(!event.target.closest?.('#game,.imgmodal,#limit'))return;
 if(!turnClockNet.ready||turnClockNet.waitingEnd){event.preventDefault();event.stopImmediatePropagation()}
},true);
// @kokoryo-end-section S0133
