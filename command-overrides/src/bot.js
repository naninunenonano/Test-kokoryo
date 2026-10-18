// Editing source only. Build with npm run build; do not load this file directly.
// Section order and the shared private scope are preserved by src/order.json.

// @kokoryo-section S0126


// Ver.0.3.133 BOT戦（試験版）。通常の対戦処理を使い、BOTの操作だけを自動化する。
// BOT機能の段階的解放設定。対応完了後は true に切り替えるだけでUI制限を解除できる。
const BOT_FEATURES={deckSelection:true,additionalPacks:true,rulePacks:false,randomizer:false};
function enforceBotRestrictions(){
 if(!botMatchMode)return;
 if(!['standard1','standard2','standard3'].includes(gameSettings.deckId))gameSettings.deckId='standard1';
 if(!BOT_FEATURES.additionalPacks)gameSettings.enabledPacks=(q('#onlineDebugPack1')?.checked?['pack1']:[]); // パック1は手動チェック、パック2は禁止
 if(!BOT_FEATURES.rulePacks)gameSettings.enabledRulePacks=[];
 if(!BOT_FEATURES.randomizer){gameSettings.randomizerEnabled=false;gameSettings.randomizerCount=0}
 resolveActiveRuleCards();
}
function updateBotLobbyRestrictions(){
 const rules=[
  ['#onlineDebugDeckPreset',BOT_FEATURES.deckSelection],
  ['#onlineDebugEditDeck',false],
  ['#onlineDebugPack1',true],
  ['#onlineDebugPack2',BOT_FEATURES.additionalPacks],
  ['#onlineDebugRulesPack1',BOT_FEATURES.rulePacks],
  ['#onlineDebugRCMode',BOT_FEATURES.rulePacks],
  ['#onlineDebugRCChoice',BOT_FEATURES.rulePacks],
  ['#onlineDebugRandomizer',BOT_FEATURES.randomizer],
  ['#onlineDebugRandomizerCount',BOT_FEATURES.randomizer]
 ];
 for(const [selector,enabled] of rules){const el=q(selector);if(el)el.disabled=botMatchMode&&!enabled}
 if(!botMatchMode)return;
 const allowedBotDecks=new Set(['standard1','standard2','standard3']);
 const deckChoices=q('#onlineDebugDeckPreset');
 if(deckChoices){
  for(const opt of deckChoices.options)opt.disabled=!allowedBotDecks.has(opt.value);
  if(!allowedBotDecks.has(deckChoices.value)){deckChoices.value='standard1';deckChoices.dataset.selectedValue='standard1'}
 }
 const deck=q('#onlineDebugDeckPreset');if(deck&&!BOT_FEATURES.deckSelection){deck.value='standard1';deck.dataset.selectedValue='standard1'}
 for(const [selector,enabled] of [['#onlineDebugPack1',true],['#onlineDebugPack2',BOT_FEATURES.additionalPacks],['#onlineDebugRulesPack1',BOT_FEATURES.rulePacks],['#onlineDebugRandomizer',BOT_FEATURES.randomizer]]){
  const el=q(selector);if(el&&!enabled)el.checked=false;
 }
 const info=q('#botDeckRestrictionNotice');if(info)info.hidden=!botMatchMode;
}
const botIsPlayer=p=>botMatchMode&&p>0&&p<4;
// Ver.0.3.151: 4人戦の合計VPと最高VPでBOTの評価段階を決定する。
function botGameStage(){
 const scores=Array.from({length:4},(_,p)=>totalVP(p));
 const max=Math.max(...scores),sum=scores.reduce((a,b)=>a+b,0);
 return max<=10&&sum<=30?0:max<=15&&sum<=60?1:2;
}
// スタンダード①の確定優先順位。数字が小さいほど優先する。
const botStandardPriority={
 '作戦計画書':[10,10,10],'人員調整書':[10,10,10],'制限令':[10,10,10],'特別許可書':[10,10,10],
 '鉱山':[1,2,5],'農場':[1,2,5],'兵舎':[1,2,5],'司令室':[1,2,5],
 '倉庫':[3,3,3],'教会':[2,4,5],
 'ナーロッパランド':[4,4,4],'領主会議':[2,1,1],'開拓ラッシュ':[7,5,2],
 '大鉱山':[2,1,3],'大農園':[2,1,3],'要塞':[2,1,3],'大司令部':[2,1,3],
 '飢饉':[3,4,8],'徴兵令':[3,4,8],'ナロパカルタ':[3,4,8],
 'オルフェンズ':[7,7,9],'納税':[2,4,8],'義賊':[3,4,8],
 '交易場':[7,7,7],'スカウト':[2,6,10]
};
function botScoreCard(c){
 const stage=botGameStage(),rank=botStandardPriority[c?.name];
 if(rank){
  // 優先度を主軸にし、終盤は勝利点を追加評価する。
  return (11-rank[stage])*10+Math.max(0,+c.vp||0)*(stage===2?4:1);
 }
 const t=String(effectText(c)||'');
 return (/命令書|毎ターン|ターン開始時/.test(t)?18:0)
  +(/資金/.test(t)?10:0)+(/兵力|食料|資源/.test(t)?4:0)
  +Math.max(0,+c.vp||0)*(stage===2?8:2);
}
// 目標カードを毎回再評価し、設置に不足する資源を優先する。
function botCardNeeds(c){if(c?.installSpec)return c.installSpec.resources||{};if(balancedInstallCost(c))return balancedInstallCost(c).resources;
 const fixed={mine:{y:2},farm:{p:2},barracks:{r:2},commandroom:{y:3,r:1},church:{y:3,p:1},plan:{r:2},adjust:{r:4},restrict:{r:3},permit:{r:3},swordhunt:{r:4},graveyard:{p:1,r:2},landgrab:{y:2,p:2,r:2},bandit:{y:4,p:3},publicmarket:{y:1,p:1,r:1},famine:{p:3},laws:{y:5},scout:{y:2,p:2,r:2},swordhunt:{r:4},graveyard:{p:1,r:2},landgrab:{y:2,p:2,r:2},bandit:{y:4,p:3},publicmarket:{y:1,p:1,r:1}};
 return fixed[c?.special]||{y:0,p:0,r:0};
}
function botTargetCard(){
 const ps=powers[turn]||{y:0,p:0,r:0};
 const cards=hands[turn]||[];
 return cards.map(c=>{let need=botCardNeeds(c),missing=['y','p','r'].reduce((sum,k)=>sum+Math.max(0,(need[k]||0)-(ps[k]||0)),0);
  // 実現可能性を強く評価。資源が揃っているカード、あと1～2資源で設置できるカードを優先。
  let score=botScoreCard(c)-missing*16+(missing===0?22:0);
  if(missing>5)score-=30;
  return {c,need,missing,score};
 }).sort((a,b)=>b.score-a.score)[0]||null;
}
function botChooseResourceColor(allowed){
 const ps=powers[turn]||{y:0,p:0,r:0},target=botTargetCard();
 const colors=allowed&&allowed.length?allowed:['y','p','r'];
 const deficits=colors.map(k=>({k,n:Math.max(0,(target?.need[k]||0)-(ps[k]||0))}));
 deficits.sort((a,b)=>b.n-a.n);
 if(deficits[0]?.n>0)return deficits[0].k;
 if(colors.includes('y')&&!hiredThisTurn&&(employees[turn]||[]).length<effectiveHireLimit()&&(ps.y||0)<5)return 'y';
 return colors.slice().sort((a,b)=>(ps[a]||0)-(ps[b]||0))[0]||'y';
}
function botTryOracle(){
 if(!oracleCanPay())return false;
 const sources=[];if(CHARACTER_DATA[charOf(turn)]?.oracleUpgrade)sources.push(['lord',-1]);
 if(abilityProfile(copiedAbility)?.oracleUpgrade)sources.push(['copy',-1]);
 if(employeeUniqueAbilitiesEnabled(turn))(employees[turn]||[]).forEach((e,i)=>{if(e.oracleUpgrade)sources.push(['employee',i])});
 if(!sources.length)return false;
 const target=(employees[turn]||[]).findIndex(oracleCanUpgradeTarget);if(target<0)return false;
 const selected=oracleDiscardCandidates().sort((a,b)=>fixedVP(a.c)-fixedVP(b.c)).slice(0,3).map(x=>x.i),previous=viewer;viewer=turn;
 try{return useOracleUpgrade(...sources[0],target,selected)}finally{viewer=previous}
}
function botTryHire(){
 if(hiredThisTurn||(employees[turn]||[]).length>=effectiveHireLimit())return false;
 if(!isHireFree()&&(!canPayResourceCost({["y"]:(5)},turn)||!unusedDice().length))return false;
 const before=(employees[turn]||[]).length;
 const oldViewer=viewer;viewer=turn;try{hireEmployee(unusedDice()[0]?.id)}finally{viewer=oldViewer}
 if((employees[turn]||[]).length>before){botLog('通常雇用を実行');return true}
 return false;
}
function botTryScout(){
 if((employees[turn]||[]).length>=effectiveHireLimit())return false;
 const i=(installed[turn]||[]).findIndex(c=>c.special==='scout');
 if(i<0)return false;
 const before=(employees[turn]||[]).length;
 const oldViewer=viewer;viewer=turn;try{useScout(i)}finally{viewer=oldViewer}
 if((employees[turn]||[]).length>before){botLog('スカウトで雇用');return true}
 return false;
}
function botPreferredColor(){return botChooseResourceColor()}
function enterBotMatch(){
 botMatchMode=true;onlineDebugMode=true;debugLocalMode=false;onlineCharSelections=Array(4).fill(null);onlineDebugPlayers=['ニーア','BOT 1','BOT 2','BOT 3'];
 updateDebugCommandVisibility();q('#entryScreen').classList.add('hidden');
 // 既存のドラフト・資源選択画面を再利用する。キャラクターは人間の選択を優先する。
 q('#onlineDebugLobby').classList.remove('hidden');renderOnlineDebugLobby();
 enforceBotRestrictions();
 const status=q('#onlineLobbyStatus');if(status)status.textContent='BOT戦：4人戦。キャラクター選択ではP1を先に確定してください。';
 const add=q('#addDummyPlayer'),remove=q('#removeDummyPlayer');if(add)add.disabled=true;if(remove)remove.disabled=true;
}
function botFillCharacters(){
 if(!botMatchMode||!onlineCharSelections[0])return;
 const families=availableCharacterFamilies();
 const used=new Set(onlineCharSelections.filter(Boolean).map(x=>x.familyId).filter(Boolean));
 const charData=window.KOKORYO_CHARACTER_DATA||{};
 const pool=families.filter(f=>!used.has(f.id));
 for(let i=1;i<4;i++)if(!onlineCharSelections[i]){
  if(!pool.length)break;
  const f=pool.splice(Math.floor(Math.random()*pool.length),1)[0];
  const versions=(f.versions||[]).filter(v=>(v.male&&charData[v.male])||(v.female&&charData[v.female]));
  if(!versions.length)continue;
  const v=versions[Math.floor(Math.random()*versions.length)];
  const choices=[v.male,v.female].filter(id=>id&&charData[id]);
  onlineCharSelections[i]={familyId:f.id,versionId:v.id,charId:choices[Math.floor(Math.random()*choices.length)]};
  used.add(f.id);
 }
 onlineCharActivePlayer=0;onlineCharPending=null;renderOnlineCharacterScreen();
}
let botDraftTimer=null;
function queueBotDraft(){
 if(!botMatchMode||q('#onlineDraftScreen').classList.contains('hidden'))return;
 if(botDraftTimer!==null)return;
 botDraftTimer=setTimeout(()=>{
  botDraftTimer=null;
  if(!botMatchMode||q('#onlineDraftScreen').classList.contains('hidden'))return;
  // 初期ドラフトは盤面VPではなく序盤のカード評価で選択する。
  for(let p=1;p<onlineDebugPlayers.length;p++){
   if(onlineDraftSelected[p])continue;
   const pack=onlineDraftPacks[p]||[];
   if(!pack.length)continue;
   const ranked=pack.map((c,i)=>({i,rank:botStandardPriority[c?.name]?.[0]??10,vp:Number(c?.vp)||0})).sort((a,b)=>a.rank-b.rank||b.vp-a.vp);
   const i=ranked[0].i;
   onlineDraftHands[p].push(pack[i]);
   pack.splice(i,1);
   onlineDraftSelected[p]=true;
  }
  onlineDraftActivePlayer=0;
  onlineDraftPendingIndex=null;
  if(onlineDraftSelected.every(Boolean)){
   if(onlineDraftRound>=INITIAL_DRAFT.picks-1){startOnlineResourceSelection();queueBotResources();return;}
   const next=Array.from({length:onlineDebugPlayers.length},()=>[]);
   for(let p=0;p<onlineDebugPlayers.length;p++)next[(p+1)%onlineDebugPlayers.length]=onlineDraftPacks[p].slice();
   onlineDraftPacks=next;
   onlineDraftRound++;
   onlineDraftSelected=Array(onlineDebugPlayers.length).fill(false);
  }
  renderOnlineDraft();
 },80);
}
function queueBotResources(){if(!botMatchMode)return;setTimeout(()=>{
 let guard=0;while(botMatchMode&&!q('#onlineResourceScreen').classList.contains('hidden')&&botIsPlayer(onlineResourceActivePlayer)&&guard++<5){
  let p=onlineResourceActivePlayer,v={y:0,p:0,r:0};
  let best=(onlineDraftHands[p]||[]).slice().sort((a,b)=>botScoreCard(b)-botScoreCard(a))[0];
  let color=/兵力/.test(best?.costText||'')?'r':/食料/.test(best?.costText||'')?'p':'y';
  const total=ruleSettingValue('initialResources',gameSettings.initialResources);v[color]=Math.max(0,total-2);if(total>0)v.y+=1;if(total>1)v.r+=1;onlineResourceChoices[p]=v;
  confirmOnlineResources();
 }
},100)}
function botLog(t){playLogAction('bot_decision',{decision:t});try{addDialog('🤖 P'+(turn+1)+' '+t)}catch(e){console.info('BOT action')}}
function botResolveStart(){let guard=0;while(guard++<35){
 if(pendingOverclockChoices.length){gainOverclockResource(botPreferredColor());continue}
 if(pendingCastResourceChoices.length){gainCastResource(botPreferredColor());continue}
 if(pendingLordResource>0){gainLordResource(botPreferredColor());continue}
 if(pendingNanban>0){gainNanban(botPreferredColor());continue}
 if(pendingTenkuCat>0){gainTenkuCat(botPreferredColor());continue}
 break;
}}
// BOTも人間と同じ負債返済コストを支払う。
// 通常時：サイコロ1個で最大2枚／命令書1枚で1枚。
// 不況など返済倍率が上がる場合も、人間の返済UIと同じ計算を使う。
// 4枚で返済開始し、0枚になるまで返済状態を維持する（プレイヤー別・対局別）。
const botDebtRepayState={game:null,active:[]};
function botTryRepayDebt(){if(depressionDebtLocked(turn))return false;
 if(botDebtRepayState.game!==playLogStart){botDebtRepayState.game=playLogStart;botDebtRepayState.active=[];}
 const debt=commandCounts[turn]||0;
 if(debt<=0){botDebtRepayState.active[turn]=false;return false;}
 if(!botDebtRepayState.active[turn]){
  if(debt<4)return false;
  botDebtRepayState.active[turn]=true;
  botLog('負債4枚以上のため完済まで返済モード');
 }
 const mult=debtRepayMultiplier();
 const dice=unusedDice();
 if(dice.length){
  const d=dice[0];
  if(!useDie(d.id))return false;
  const n=Math.min(Math.max(1,Math.floor(2/mult)),debt);
  commandCounts[turn]-=n;komePlace+=n;
  if(commandCounts[turn]===0)botDebtRepayState.active[turn]=false;
  playLogAction('bot_debt_repayment',{player:turn+1,method:'die',die:d.value,returned:n});
  botLog('サイコロ'+d.value+'を消費して負債'+n+'枚を返済');
  return true;
 }
 if((breadHands[turn]||[]).length>=mult){
  for(let i=0;i<mult;i++)breadDiscard.push(breadHands[turn].pop());
  recycleBreadIfEmpty();
  commandCounts[turn]--;komePlace++;
  if(commandCounts[turn]===0)botDebtRepayState.active[turn]=false;
  playLogAction('bot_debt_repayment',{player:turn+1,method:'command',spent:mult,returned:1});
  botLog('命令書'+mult+'枚を消費して負債1枚を返済');
  return true;
 }
 return false;
}
function botTryExchangeForInstall(){
 if(hasEquivalentExchange(turn))return false;
 const ps=powers[turn];if(!ps||!(hands[turn]||[]).length)return false;
 const lord=CHARACTER_DATA[charOf(turn)]||{},staff=employeeUniqueAbilitiesEnabled(turn)?(employees[turn]||[]):[];
 const rate=exchangeRateFor();
 const colors=['y','p','r'];
 for(const c of [...hands[turn]].sort((a,b)=>botScoreCard(b)-botScoreCard(a))){
  // Only the known fixed-cost cards; other card-specific conditions remain in botTryInstall.
  if(c.type!=='S')continue; // 通常カードの特殊条件を未確認のまま交換しない
  const need=botCardNeeds(c),missing=colors.filter(k=>(need[k]||0)>(ps[k]||0));
  if(missing.length!==1)continue;
  const to=missing[0],shortage=(need[to]||0)-ps[to];
  if(shortage!==1)continue;
  const faces={mine:[1,2],farm:[3,4],barracks:[5,6],commandroom:[3,4],warehouse:[1,3,5],church:[1,4]}[c.special];
  if(faces&&!unusedDice().some(d=>faces.includes(d.value))&&!(breadHands[turn]||[]).some(b=>b.value==='any'||faces.includes(b.value)))continue;
  const from=colors.filter(k=>k!==to&&ps[k]>=rate+(need[k]||0)).sort((a,b)=>ps[b]-ps[a])[0];
  if(!from)continue;
  const result=cardCommands.change('exchange',{from,to,rollbackBlocked:true});const gained=result.amount;
  if(!gained)continue
  playLogAction('resource_exchange',{from,to,spent:rate,gained,actor:'bot',purpose:'install',card:playLogCard(c)});
  botLog(c.name+'の設置を目指し'+cname(from)+'を'+cname(to)+'に交換');return true;
 }
 return false;
}
// Search distinct existing payment options, then use the same installer as a human.
function botTryPackInstall(c,index){
 const spec=c.installSpec;if(!spec||typeof spec.resolve==='function'||!canPayResourceCost(spec.resources||{}))return false;
 const any=typeof spec.any==='function'?spec.any({card:c,owner:turn,api:packRuntimeApi(turn)}):spec.any||0;
 const needs=[...(spec.faces||[]),...Array.from({length:any},()=>null)],opts=installCostOptions(null),used=new Set(),selected=[];
 function search(i){if(i===needs.length)return true;for(const o of opts){if(used.has(o.id))continue;const [kind,n]=o.id.split(':'),v=kind==='d'?unusedDice().find(d=>d.id===+n)?.value:kind==='b'?breadHands[turn][+n]?.value:'any';if(v===undefined||needs[i]&&v!=='any'&&!needs[i].includes(v))continue;used.add(o.id);selected.push(o.id);if(search(i+1))return true;used.delete(o.id);selected.pop()}return false}
 if(!search(0))return false;const before=hands[turn].length,old=viewer;viewer=turn;
 try{installPackCard(index,selected)}finally{viewer=old}return hands[turn].length<before
}
function botTryFusion(){
 const options=synthesisOptions(turn);if(!options.length)return false;
 const before=(employees[turn]||[]).length,old=viewer;viewer=turn;
 try{synthesizeCast(options.find(o=>o.clrFusion)||options[0])}finally{viewer=old}
 return (employees[turn]||[]).length<before||fusionUsedThisTurn
}
function botTryInstall(){
 let h=hands[turn]||[],ps=powers[turn];
 let order=h.map((c,i)=>({c,i,v:botScoreCard(c)})).sort((a,b)=>b.v-a.v);
 for(let {c,i} of order){
  if(c.installSpec){if(botTryPackInstall(c,i)){botLog(c.name+'を設置');return true}continue}
  if(balancedInstallCost(c)){
   const choices=balancedCostChoices(c),base={greatermine:'mine',greaterfarm:'farm',greaterbarracks:'barracks',greatercommand:'commandroom'}[c.special];
   const index=base?installed[turn].findIndex(x=>x.special===base):-1;
   if(index>=0&&installBalancedCard(i,[],index)||choices&&installBalancedCard(i,choices)){botLog(c.name+'を設置');return true}continue
  }
  if(c.type==='S'){
   let need={y:0,r:0,p:0},vals=null;
   if(c.special==='plan')need.r=2;else if(c.special==='adjust')need.r=4;
   else if(['restrict','permit'].includes(c.special))need.r=3;
   else if(c.special==='mine'){need.y=2;vals=[1,2]}
   else if(c.special==='farm'){need.p=2;vals=[3,4]}
   else if(c.special==='barracks'){need.r=2;vals=[5,6]}
   else if(c.special==='commandroom'){need.y=3;need.r=1;vals=[3,4]}
   else if(c.special==='warehouse')vals=[1,3,5];
   else if(c.special==='church'){need.y=3;need.p=1;vals=[1,4]}
   if(!canPayResourceCost(need))continue;
   let choice='';if(vals){let d=unusedDice().find(x=>vals.includes(x.value));if(d)choice='d:'+d.id;
    else {let ix=breadHands[turn].findIndex(x=>x.value==='any'||vals.includes(x.value));if(ix>=0)choice='b:'+ix;else continue}}
   let before=hands[turn].length;installStandard(i,choice);if(hands[turn].length<before){botLog(c.name+'を設置');return true}continue;
  }
  // 通常カードの支払いに使える実ダイス／命令書を選択する。
  if(c.type!=='S' && !['laws','scout'].includes(c.special)){
   let requirements={
    swordhunt:{res:{r:4},faces:[6]},graveyard:{res:{p:1,r:2},faces:[[4,5]]},
    landgrab:{res:{y:2,p:2,r:2},faces:[2,5]},
    bandit:{res:{y:4,p:3},faces:[null,null,null]},
    publicmarket:{res:{y:1,p:1,r:1},faces:[null]},
    famine:{res:{p:3},faces:[3,3,3]}
   };
   let spec=requirements[c.special];
   if(spec && canPayResourceCost(spec.res)){
    let selected=[],used=new Set(),diceNow=unusedDice();
    for(let face of spec.faces){
     let faces=Array.isArray(face)?face:face===null?null:[face];
     let d=diceNow.find(x=>!used.has('d:'+x.id)&&(!faces||faces.includes(x.value)));
     if(d){selected.push('d:'+d.id);used.add('d:'+d.id);continue}
     let b=(breadHands[turn]||[]).findIndex((x,j)=>!used.has('b:'+j)&&(x.value==='any'||!faces||faces.includes(x.value)));
     if(b>=0){selected.push('b:'+b);used.add('b:'+b);continue}
     break;
    }
    if(selected.length===spec.faces.length){
     let before=hands[turn].length;
     installNewNormal(i,selected);
     if(hands[turn].length<before){botLog(c.name+'を設置');return true}
    }
   }
  }
  if(c.special==='paneteria' && totalHandCount(turn)>=handLimit(turn)){
   let d=unusedDice()[0];if(d){installPaneteria(i,'d:'+d.id);botLog(c.name+'を設置');return true}
  }
  if(c.special==='laws'&&canPayResourceCost({y:5})){let before=hands[turn].length;installNewNormal(i,[]);if(hands[turn].length<before){botLog(c.name+'を設置');return true}}
  if(c.special==='scout'&&canPayResourceCost({y:2,p:2,r:2})&&(employees[turn]||[]).length<effectiveHireLimit()){
   let before=hands[turn].length;installNewNormal(i,[]);if(hands[turn].length<before){botLog(c.name+'を設置');return true}
  }
 }
 return false;
}
function botDiscardOverflow(){let guard=0;while(handLimitNeedsDiscard(turn)&&guard++<30){
 let h=hands[turn];if(h.length){let order=h.map((c,i)=>({i,v:botScoreCard(c)})).sort((a,b)=>a.v-b.v);discard.push(h.splice(order[0].i,1)[0]);continue}
 if(breadHands[turn].length){breadDiscard.push(breadHands[turn].pop());continue}
 if(commandCounts[turn]>0&&!depressionProtectsDebtAtHandLimit()&&!depressionDebtLocked(turn)){commandCounts[turn]--;komePlace++;continue}
 break;
}}
// BOTの行動を段階表示。各BOTのターンを一括実行しない。
const botPause=ms=>{const owner=turn,token=turnClockState.token;return new Promise(resolve=>setTimeout(resolve,ms)).then(()=>{if(!turnClockBotValid(owner,token))throw TURN_CLOCK_CANCEL})};
// ナーロッパランドの全員選択が完了するまでBOTの行動を止める。
// P1の選択は人間が操作し、BOTの選択はrenderParkChoiceで自動実行する。
async function botWaitForParkChoice(actor){
 while(botMatchMode&&turn===actor&&pendingParkPlayers.length&&!gameEnded){
  renderParkChoice();
  await botPause(250);
 }
}

async function botExecuteTurn(){
 if(botBusy||!botIsPlayer(turn)||gameEnded)return;
 botBusy=true;const actor=turn,clockBotToken=turnClockState.token;
 try{
  viewer=0;renderGame();botLog('ターン開始');await botPause(900);if(!turnClockBotValid(actor,clockBotToken))return;
  botResolveStart();renderGame();await botPause(500);if(!turnClockBotValid(actor,clockBotToken))return;await botWaitForParkChoice(actor);if(!turnClockBotValid(actor,clockBotToken))return;
  for(let k=0;k<10&&turn===actor;k++){
   if(!botTryInstall()&&!botTryOracle()){if(!botTryExchangeForInstall()||!botTryInstall())break;}
   renderGame();await botWaitForParkChoice(actor);if(!turnClockBotValid(actor,clockBotToken))return;await botPause(950);if(!turnClockBotValid(actor,clockBotToken))return;
  }
  if(botTryScout()){renderGame();await botPause(700)}
  if(botTryHire()){renderGame();await botPause(700)}
  let guard=0;
  while(turn===actor&&unusedDice().length&&guard++<20){
   if(botTryRepayDebt()){renderGame();await botPause(750);if(!turnClockBotValid(actor,clockBotToken))return;continue;}
   let acted=false;
   const target=botTargetCard(),psNow=powers[turn]||{};
   if(target&&target.missing>0&&target.missing<=3){
    const deficit=['y','p','r'].filter(k=>(target.need[k]||0)>(psNow[k]||0));
    const chosen=unusedDice().find(d=>deficit.includes(colorFor(d.value)));
    if(chosen){const color=colorFor(chosen.value);if(useDie(chosen.id)){
     gainResource(turn,color,1,'dice');botLog('設置目標「'+target.c.name+'」の不足資源を獲得');acted=true;
    }}
   }
   if(!acted&&totalHandCount(turn)<handLimit(turn)){
    let options=[...groups()].filter(([key,cards])=>cards.length+totalHandCount(turn)<=handLimit(turn));
    options.sort((a,b)=>{
     const ps=powers[turn];
     const score=([,cards])=>{const c=cards[0],need=botCardNeeds(c),missing=['y','p','r'].reduce((n,k)=>n+Math.max(0,(need[k]||0)-(ps[k]||0)),0);return botScoreCard(c)-missing*7+Math.min(cards.length,2)*3};
     return score(b)-score(a);
    });
    if(options.length){
     // Preserve a matching die for cards that can be installed this turn.
     const neededFaces=new Set();
     for(const c of hands[turn]||[]){
      const need=botCardNeeds(c);
      if(!canPayResourceCost(need))continue;
      const faces={mine:[1,2],farm:[3,4],barracks:[5,6],commandroom:[3,4],warehouse:[1,3,5],church:[1,4]}[c.special];
      if(faces&&!((breadHands[turn]||[]).some(b=>b.value==='any'||faces.includes(b.value))))faces.forEach(v=>neededFaces.add(v));
     }
     const diceChoices=unusedDice();
     const d=diceChoices.find(x=>!neededFaces.has(x.value))||diceChoices[0];
     const item=options[0],before=hands[turn].length;
     takeMarket(item[0],d.id);
     acted=hands[turn].length>before;
     if(acted)botLog('公開場から'+item[1][0].name+'×'+item[1].length+'を獲得（出目'+d.value+'）');
    }
   }
   if(!acted){
    let d=unusedDice()[0];if(!d)break;
    let choices=unusedDice(),preferred=botChooseResourceColor();
    d=choices.find(x=>colorFor(x.value)===preferred)||choices[0];
    let color=colorFor(d.value);cardCommands.change('convert',3,{kind:'die',dieId:d.id,source:'dice'});
    botLog('サイコロ'+d.value+'で資源を獲得');renderGame();
   }
   await botPause(750);if(!turnClockBotValid(actor,clockBotToken))return;await botWaitForParkChoice(actor);if(!turnClockBotValid(actor,clockBotToken))return;
   if(botTryInstall()||(botTryExchangeForInstall()&&botTryInstall())){renderGame();await botWaitForParkChoice(actor);if(!turnClockBotValid(actor,clockBotToken))return;await botPause(950)}
   if(botTryScout()){renderGame();await botPause(600)}
   if(botTryHire()){renderGame();await botPause(600)}
  }
  for(let k=0;k<10&&turn===actor;k++){
   if(!botTryInstall()&&!botTryOracle()){if(!botTryExchangeForInstall()||!botTryInstall())break;}
   renderGame();await botWaitForParkChoice(actor);if(!turnClockBotValid(actor,clockBotToken))return;await botPause(950);if(!turnClockBotValid(actor,clockBotToken))return;
  }
  if(botTryFusion()){renderGame();await botPause(500)}
  // サイコロを使い切った後も、命令書が余っていれば通常ルールで返済する。
  for(let k=0;k<30&&turn===actor&&(commandCounts[turn]||0)>0;k++){
   if(!botTryRepayDebt())break;
   renderGame();await botPause(450);if(!turnClockBotValid(actor,clockBotToken))return;
  }
  await botWaitForParkChoice(actor);if(!turnClockBotValid(actor,clockBotToken))return;
  await botWaitForParkChoice(actor);if(!turnClockBotValid(actor,clockBotToken))return;
  if(!(hands[turn]||[]).length&&['y','p','r'].reduce((s,k)=>s+(powers[turn]?.[k]||0),0)>=12)botLog('手札0枚・資源12以上で終了：公開場の獲得可否を要確認');
  botDiscardOverflow();botLog('ターン終了');renderGame();await botPause(1200);if(!turnClockBotValid(actor,clockBotToken))return;
  if(!turnClockBotValid(actor,clockBotToken))return;viewer=0;completeEnd();
 }catch(err){if(err===TURN_CLOCK_CANCEL||!turnClockBotValid(actor,clockBotToken))return;console.error('BOT turn failed',err);botLog('処理を中断しました');viewer=0;try{botDiscardOverflow();completeEnd()}catch(e){console.error(e)}}
 finally{botBusy=false;if(botIsPlayer(turn)&&!gameEnded)queueBotTurn();else renderGame()}
}
function queueBotTurn(){
 if(!botMatchMode||!botIsPlayer(turn)||gameEnded)return;
 if(botTimer)clearTimeout(botTimer);
 const owner=turn,token=turnClockState.token;botTimer=setTimeout(()=>{if(turnClockBotValid(owner,token))void botExecuteTurn()},650);
}
// ドラフトの確定ボタンは既存の選択処理を利用。
const botDraftConfirmOriginal=confirmOnlineDraftPick;
// @kokoryo-end-section S0126

// @kokoryo-section S0129

function turnClockBotValid(owner,token){return turnClockLeaseValid(owner,token)&&!turnClockState.expiring}
// @kokoryo-end-section S0129
