// Editing source only. Build with npm run build; do not load this file directly.
// Section order and the shared private scope are preserved by src/order.json.

// @kokoryo-section S0109

q('#coroconvert').onclick=()=>{if(charOf(turn)!=='coronelia')return;let id=q('#corodie').value,d=useDie(id);if(!d)return alert('使用できるサイコロがありません。');gainResource(turn,q('#corocolor').value,3,'effect');renderGame()};
q('#closeHireDiceModal').onclick=()=>q('#hireDiceModal').classList.add('hidden');q('#hireDiceModal').onclick=e=>{if(e.target.id==='hireDiceModal')q('#hireDiceModal').classList.add('hidden')};q('#cancelEndTurn').onclick=()=>q('#endTurnConfirmModal').classList.add('hidden');q('#confirmEndTurn').onclick=()=>{q('#endTurnConfirmModal').classList.add('hidden');finishTurn()};q('#endTurnConfirmModal').onclick=e=>{if(e.target.id==='endTurnConfirmModal')q('#endTurnConfirmModal').classList.add('hidden')};
q('#showDraftOwned').onclick=showDraftOwnedCards;q('#closeDraftOwned').onclick=()=>q('#draftOwnedModal').classList.add('hidden');q('#draftOwnedModal').onclick=e=>{if(e.target.id==='draftOwnedModal')q('#draftOwnedModal').classList.add('hidden')};q('#charability').onclick=showCharacterAbility;q('#closeAbilityModal').onclick=()=>q('#abilityModal').classList.add('hidden');q('#abilityModal').onclick=e=>{if(e.target.id==='abilityModal')q('#abilityModal').classList.add('hidden')};q('#showDialogLog').onclick=showDialogLog;q('#closeDialogLog').onclick=()=>q('#dialogLogModal').classList.add('hidden');q('#dialogLogModal').onclick=e=>{if(e.target.id==='dialogLogModal')q('#dialogLogModal').classList.add('hidden')};q('#showActiveRules').onclick=showActiveRules;q('#closeActiveRules').onclick=()=>q('#activeRulesModal').classList.add('hidden');q('#activeRulesModal').onclick=e=>{if(e.target.id==='activeRulesModal')q('#activeRulesModal').classList.add('hidden')};q('#showHireCardList').onclick=showHireCardList;q('#closeHireCardList').onclick=()=>q('#hireCardListModal').classList.add('hidden');q('#hireCardListModal').onclick=e=>{if(e.target.id==='hireCardListModal')q('#hireCardListModal').classList.add('hidden')};q('#showCardList').onclick=showCardList;q('#closeCardList').onclick=()=>q('#cardListModal').classList.add('hidden');q('#cardListModal').onclick=e=>{if(e.target.id==='cardListModal')q('#cardListModal').classList.add('hidden')};q('#showDiscard').onclick=showDiscardPile;q('#closeDiscard').onclick=()=>q('#discardModal').classList.add('hidden');q('#discardModal').onclick=e=>{if(e.target.id==='discardModal')q('#discardModal').classList.add('hidden')};q('#closeCardDetail').onclick=()=>q('#cardDetailModal').classList.add('hidden');q('#cardDetailInstall').onclick=openSelectedInstall;q('#closeInstallModal').onclick=()=>q('#installModal').classList.add('hidden');q('#showHand').onclick=showHandCards;q('#closeHand').onclick=()=>q('#handModal').classList.add('hidden');q('#handModal').onclick=e=>{if(e.target.id==='handModal')q('#handModal').classList.add('hidden')};
q('#refresh').onclick=()=>{let p=powers[turn];if(p.y<1||p.r<1||p.p<1)return alert('資金・兵力・食料が1個ずつ必要です。');blockAllMarketUndo('市場入れ替えを行いました。');cardCommands.change('market','all',{cost:{y:1,r:1,p:1}});renderGame()};
// @kokoryo-end-section S0109

// @kokoryo-section S0117

setupCompactUI();playLogReset();
q('#playerCount').addEventListener('change',renderCharacterSelects);renderPlayerCountChoices();renderCharacterSelects();refreshSetupDeckPreset();fillLegendSlotSelect('#settingLegendSlots','standard1',gameSettings.legendSlots);q('#deckPreset')?.addEventListener('change',()=>{q('#editDeck').disabled=q('#deckPreset').value!=='custom';fillLegendSlotSelect('#settingLegendSlots',q('#deckPreset').value,gameSettings.legendSlots)});
q('#deckPreset').addEventListener('change',()=>{q('#editDeck').disabled=q('#deckPreset').value!=='custom'});
// @kokoryo-end-section S0117

// @kokoryo-section S0119

q('#editDeck').onclick=openDeckEditor;const closeDeckEditor=()=>{
 q('#deckEditorModal').classList.add('hidden');
 if(onlineDebugMode&&gameSettings.deckId==='custom'){
  let name=(q('#deckSaveName')?.value||'').trim();
  if(name&&getSavedDecks()[name]){let sel=q('#onlineDebugDeckPreset');if(sel)sel.dataset.selectedValue='saved:'+name}
  populateOnlineDebugDeckPreset();
 }
 if(realLobbyChannel&&isRealLobbyHost()&&realOnlineDeckId==='custom')broadcastRealDeckConfig()
};q('#deckEditorClose').onclick=closeDeckEditor;q('#deckEditorCloseTop').onclick=closeDeckEditor;q('#deckEditorModal').onclick=e=>{if(e.target===q('#deckEditorModal'))closeDeckEditor()};document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!q('#deckEditorModal').classList.contains('hidden'))closeDeckEditor()});q('#deckSaveBtn').onclick=saveCustomDeck;q('#deckLoadBtn').onclick=loadCustomDeck;q('#deckDeleteBtn').onclick=deleteCustomDeck;q('#mainReturnLobby').onclick=confirmReturnToLobby;q('#reroll').onclick=beginTurn;q('#endturn').onclick=openEndTurnConfirm;q('#start').onclick=()=>{if(onlineDebugMode)return;if(q('#setup').classList.contains('hidden')){q('#setup').classList.remove('hidden');q('#draft').classList.add('hidden');q('#gamestartsetup').classList.add('hidden');q('#game').classList.add('hidden');q('#start').textContent='ゲーム開始';q('#status').textContent='開始設定を選んでください。'}else start()};
// @kokoryo-end-section S0119

// @kokoryo-section S0121

q('#modalimg').onclick=()=>q('#imgmodal').classList.add('hidden');
q('#closeExpandedCard').onclick=()=>q('#imgmodal').classList.add('hidden');
q('#imgmodal').addEventListener('click',e=>{if(e.target===q('#imgmodal'))q('#imgmodal').classList.add('hidden')});
document.addEventListener('click',e=>{let img=e.target.closest&&e.target.closest('.zoomable');if(!img)return;/* 選択用カード内の画像タップはカード本体のクリックを優先する */if(img.closest&&img.closest('button.card'))return;if(img.closest&&img.closest('#market .card'))return;e.preventDefault();e.stopPropagation();openCardImage(img, [...(typeof market!=='undefined'?market:[]),...(typeof LEGEND_CATALOG!=='undefined'?LEGEND_CATALOG:[]),...(typeof STANDARD_CATALOG!=='undefined'?STANDARD_CATALOG:[])].find(c=>resolvedContentImage(c)===img.getAttribute('src')||c.name===img.alt)||null)},true);
document.addEventListener('contextmenu',e=>{if(e.target.closest&&e.target.closest('.zoomable'))e.preventDefault()});
// @kokoryo-end-section S0121

// @kokoryo-section S0123

updateDebugCommandVisibility();
// @kokoryo-end-section S0123

// @kokoryo-section S0127


async function handleEntryJoin(){
 const name=(q('#entryName')?.value||'').trim();
 const pass=(q('#entryPass')?.value||'').trim();
 const err=q('#entryError'); if(err)err.textContent='';
 if(name==='ニーア' && pass==='オートマタ'){enterBotMatch();return;}
 if(name==='バレンタイン' && pass==='オーバークロック'){enterOnlineDebugLobby();return;}
 if(!name){if(err)err.textContent='名前を入力してください。';return;}
 if(!pass){if(err)err.textContent='合言葉を入力してください。';return;}
 await enterRealOnlineLobby(name,pass);
}
const initialEntryName=q('#entryName');if(initialEntryName)initialEntryName.value='';
const entryJoin=q('#entryJoin');if(entryJoin)entryJoin.onclick=handleEntryJoin;
const leaveRealLobbyBtn=q('#leaveRealLobby');if(leaveRealLobbyBtn)leaveRealLobbyBtn.onclick=leaveRealOnlineLobby;
['#onlineCharLeaveRoom','#onlineDraftLeaveRoom','#onlineResourceLeaveRoom','#mainLeaveRoom'].forEach(sel=>{const b=q(sel);if(b)b.onclick=leaveRealOnlineLobby});
const realLobbyEditDeck=q('#realLobbyEditDeck');if(realLobbyEditDeck)realLobbyEditDeck.onclick=()=>{if(isRealLobbyHost()&&realOnlineDeckId==='custom')openDeckEditor()};
const realLobbySubmitDeckBtn=q('#realLobbySubmitDeckBtn');if(realLobbySubmitDeckBtn)realLobbySubmitDeckBtn.onclick=()=>submitRealLobbyDeck().catch(console.error);const realLobbyEditDeckBtn=q('#realLobbyEditDeck');if(realLobbyEditDeckBtn)realLobbyEditDeckBtn.onclick=openDeckEditor;
const realRulePack1=q('#realRulePack1');if(realRulePack1)realRulePack1.onchange=()=>changeRealLobbyRule('pack1Enabled',realRulePack1.checked);const realRulePack2=q('#realRulePack2');if(realRulePack2)realRulePack2.onchange=()=>changeRealLobbyRule('pack2Enabled',realRulePack2.checked);const realRulesPack1=q('#realRuleRulesPack1');if(realRulesPack1)realRulesPack1.onchange=()=>changeRealLobbyRule('rulesPack1Enabled',realRulesPack1.checked);const realRCMode=q('#realRuleRCMode');if(realRCMode)realRCMode.onchange=()=>changeRealLobbyRule('ruleCardMode',realRCMode.value);const realRCChoice=q('#realRuleRCChoice');if(realRCChoice)realRCChoice.onchange=()=>changeRealLobbyRule('ruleCardChoice',realRCChoice.value);
populateOnlineDebugDeckPreset();let dre=q('#onlineDebugRandomizer'),drc=q('#onlineDebugRandomizerCount');if(dre)dre.checked=!!gameSettings.randomizerEnabled;if(drc){drc.value=clampedRandomizerCount(gameSettings.randomizerCount);drc.max=implementedNormalCards().length;drc.disabled=false}function setDebugPackEnabled(id,on){let s=new Set(gameSettings.enabledPacks||[]);if(on)s.add(id);else s.delete(id);gameSettings.enabledPacks=[...s];refreshSetupDeckPreset();populateOnlineDebugDeckPreset();onlineCharSelections=Array(6).fill(null);onlineCharPending=null;}
const debugPack1=q('#onlineDebugPack1');if(debugPack1){debugPack1.checked=gameSettings.enabledPacks.includes('pack1');debugPack1.onchange=()=>setDebugPackEnabled('pack1',debugPack1.checked)}
const debugPack2=q('#onlineDebugPack2');if(debugPack2){debugPack2.checked=gameSettings.enabledPacks.includes('pack2');debugPack2.onchange=()=>setDebugPackEnabled('pack2',debugPack2.checked)}
const debugRulesPack1=q('#onlineDebugRulesPack1');if(debugRulesPack1)debugRulesPack1.onchange=()=>{gameSettings.enabledRulePacks=debugRulesPack1.checked?['rules_pack1']:[];resolveActiveRuleCards()};const debugRCMode=q('#onlineDebugRCMode');if(debugRCMode)debugRCMode.onchange=()=>{gameSettings.ruleCardMode=debugRCMode.value;let c=q('#onlineDebugRCChoice');if(c)c.disabled=debugRCMode.value==='random';resolveActiveRuleCards()};fillRCSelect('#onlineDebugRCChoice');const debugRCChoice=q('#onlineDebugRCChoice');if(debugRCChoice)debugRCChoice.onchange=()=>{gameSettings.ruleCardChoice=debugRCChoice.value;resolveActiveRuleCards()};const onlineDebugDeckPreset=q('#onlineDebugDeckPreset');if(onlineDebugDeckPreset)onlineDebugDeckPreset.onchange=()=>{let v=onlineDebugDeckPreset.value;onlineDebugDeckPreset.dataset.selectedValue=v;if(String(v).startsWith('saved:')){let name=v.slice(6),d=getSavedDecks()[name];if(d){customDeck=cloneCustomDeck(d);gameSettings.deckId='custom';q('#deckSaveName').value=name}q('#onlineDebugEditDeck').disabled=false}else{gameSettings.deckId=v;q('#onlineDebugEditDeck').disabled=true}fillLegendSlotSelect('#onlineDebugRuleLegendSlots',gameSettings.deckId,gameSettings.legendSlots)};
const onlineDebugEditDeck=q('#onlineDebugEditDeck');if(onlineDebugEditDeck){
 onlineDebugEditDeck.disabled=false;
 onlineDebugEditDeck.onclick=()=>{
  let sel=q('#onlineDebugDeckPreset'),v=sel?.value||gameSettings.deckId;
  if(String(v).startsWith('saved:')){
   let name=String(v).slice(6),d=getSavedDecks()[name];
   if(d){customDeck=cloneCustomDeck(d);gameSettings.deckId='custom';q('#deckSaveName').value=name}
  }else{
   let cfg=activeDeckConfig(v);
   customDeck=cloneCustomDeck(cfg);
   gameSettings.deckId='custom';
   q('#deckSaveName').value='';
  }
  openDeckEditor();
 }
};
const realLobbyCharacterSelectBtn=q('#realLobbyCharacterSelect');if(realLobbyCharacterSelectBtn)realLobbyCharacterSelectBtn.onclick=async()=>{if(!isRealLobbyHost())return;await broadcastRealPhase('character');setRealOnlinePhase('character');try{await trackRealLobbyPresence()}catch(e){console.error(e)}};
q('#addDummyPlayer').onclick=()=>{if(onlineDebugPlayers.length>=6)return;onlineDebugPlayers.push('テストプレイヤー'+(onlineDebugPlayers.length+1));renderOnlineDebugLobby()};
q('#removeDummyPlayer').onclick=()=>{if(onlineDebugPlayers.length>1)onlineDebugPlayers.pop();renderOnlineDebugLobby()};
q('#leaveOnlineDebug').onclick=leaveOnlineDebugLobby;
q('#onlineLobbyCharacterSelect').onclick=()=>{captureOnlineDebugLobbyPendingSettings();if(onlineDebugPlayers.length<2){const st=q('#onlineLobbyStatus');if(st)st.textContent='仮プレイヤーを追加すると複数人での共有選択を確認できます。';}openOnlineCharacterScreen()};
q('#onlineCharBack').onclick=()=>{if(realOnlineCharacterMode||onlineDebugMode)confirmReturnToLobby();else closeOnlineCharacterScreen()};
q('#onlineCharNext').onclick=async()=>{if(realOnlineCharacterMode){if(!realLobbyCharSelection||realLobbyCharReady)return;if(!realCharacterSelectionAllowed(realLobbyCharSelection)||realFamilyTaken(realLobbyCharSelection.familyId)){realLobbyCharSelection=null;realLobbyCharReady=false;realLobbyCharPending=null;await trackRealLobbyPresence().catch(console.error);renderRealOnlineCharacterScreen();alert('このキャラクターは他のプレイヤーが選択しています。別のキャラクターを選択してください。');return}realLobbyCharReady=true;try{await trackRealLobbyPresence()}catch(e){console.error(e);realLobbyCharReady=false}renderRealOnlineCharacterScreen();return}if(botMatchMode){if(!onlineCharSelections[0]){q('#onlineCharStatus').textContent='先にP1のキャラクターを選択してください。';return;}botFillCharacters();startOnlineDraft();queueBotDraft();return;}const n=onlineDebugPlayers.length;if(onlineCharSelections.slice(0,n).some(x=>!x))return;const draftError=initialDraftSetupError(n);if(draftError)return alert(draftError);startOnlineDraft();autoCompleteOnlineDebugSetup();};q('#onlineDraftConfirm').onclick=()=>{if(realOnlineDraftMode)confirmRealOnlineDraftPick();else {if(botMatchMode&&onlineDraftActivePlayer!==0)return;confirmOnlineDraftPick();if(botMatchMode)queueBotDraft()}};q('#onlineResourceConfirm').onclick=()=>{if(realOnlineResourceMode)confirmRealOnlineResources();else {confirmOnlineResources();if(botMatchMode)queueBotResources()}};q('#onlineDraftReturnLobby').onclick=confirmReturnToLobby;q('#onlineResourceReturnLobby').onclick=confirmReturnToLobby;
['#entryName','#entryPass'].forEach(sel=>{const el=q(sel);if(el)el.addEventListener('keydown',e=>{if(e.key==='Enter')handleEntryJoin()})});

// Ver.3.9: resume check must run inside this scope so the saved-session helpers are accessible.
setTimeout(()=>{const r=loadRealOnlineResume();if(r?.roomKey&&r?.name){const err=q('#entryError');if(err)err.textContent='前回のオンラインルームへ再接続しています...';enterRealOnlineLobby(r.name,'',r)}},0);
// @kokoryo-end-section S0127

// @kokoryo-section S0132

// Stop a late user click before it can act on an expired player's turn.
document.addEventListener('click',event=>{
 if(!turnClockState||turnClockState.active===null||turnClockState.resolving||!turnClockVisible())return;
 if(!event.target.closest?.('#game,.imgmodal'))return;
 turnClockAccount();
 if(turnClockState.expiring||turnClockState.remaining[turnClockState.active]<=0){event.preventDefault();event.stopImmediatePropagation();turnClockTick()}
},true);
setInterval(turnClockTick,200);
document.addEventListener('visibilitychange',turnClockTick);
window.addEventListener('pageshow',turnClockTick);
turnClockRender();
// Ver.3.15: オンラインロビーのルール設定。
[['#realRuleWinVP','winVP'],['#realRuleMarketTypes','marketTypes'],['#realRuleInitialResources','initialResources'],['#realRuleHireLimit','hireLimit'],['#realRuleLegendSlots','legendSlots']].forEach(([sel,key])=>{q(sel)?.addEventListener('change',e=>changeRealLobbyRule(key,e.target.value))});
q('#realRuleRandomizer')?.addEventListener('change',e=>changeRealLobbyRule('randomizerEnabled',e.target.checked));q('#realRuleRandomizerCount')?.addEventListener('input',e=>{if(isRealLobbyHost())realOnlineRules.randomizerCount=Math.max(0,Math.floor(Number(e.target.value)||0))});q('#realRuleRandomizerCount')?.addEventListener('change',e=>changeRealLobbyRule('randomizerCount',e.target.value));
q('#settingMarketTypes')?.addEventListener('change',e=>{let n=ruleSettingValue('marketTypes',e.target.value);e.target.value=n;gameSettings.marketTypes=n;syncMarketTargetUI()});
q('#onlineDebugRuleMarketTypes')?.addEventListener('change',e=>{let n=ruleSettingValue('marketTypes',e.target.value);e.target.value=n;gameSettings.marketTypes=n;syncMarketTargetUI()});
q('#onlineDebugRandomizer')?.addEventListener('change',e=>{gameSettings.randomizerEnabled=e.target.checked;q('#onlineDebugRandomizerCount').disabled=false});q('#onlineDebugRandomizerCount')?.addEventListener('input',e=>{let raw=Math.max(0,Math.floor(Number(e.target.value)||0));gameSettings.randomizerCount=raw;e.target.max=implementedNormalCards().length});q('#onlineDebugRandomizerCount')?.addEventListener('change',e=>{let n=clampedRandomizerCount(e.target.value);e.target.value=n;gameSettings.randomizerCount=n});q('#onlineDebugRuleWinVP')?.addEventListener('input',e=>{const n=Math.floor(Number(e.target.value));if(Number.isFinite(n)&&n>=1)gameSettings.winVP=n});[['#onlineDebugRuleWinVP','winVP',1],['#onlineDebugRuleMarketTypes','marketTypes',1],['#onlineDebugRuleInitialResources','initialResources',0],['#onlineDebugRuleHireLimit','hireLimit',0],['#onlineDebugRuleLegendSlots','legendSlots',1]].forEach(([sel,key,min])=>q(sel)?.addEventListener('change',e=>{let n=Math.max(min,Math.floor(Number(e.target.value)||min));e.target.value=n;gameSettings[key]=n;if(key==='marketTypes')syncMarketTargetUI()}));


// @kokoryo-end-section S0132

// @kokoryo-section S0134

const q=s=>document.querySelector(s);
q('#cardDetailModal').onclick=e=>{if(e.target===q('#cardDetailModal'))q('#cardDetailModal').classList.add('hidden')};q('#installModal').onclick=e=>{if(e.target===q('#installModal'))q('#installModal').classList.add('hidden')};


// @kokoryo-end-section S0134
