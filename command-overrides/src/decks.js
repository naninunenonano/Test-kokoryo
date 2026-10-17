// Editing source only. Build with npm run build; do not load this file directly.
// Section order and the shared private scope are preserved by src/order.json.

// @kokoryo-section S0002

// コンテンツ内部IDの予約範囲。未実装IDの空データは作らず、追加パックから必要なIDだけ登録する。
const CONTENT_ID_LIMITS=Object.freeze({S:10,N:200,LL:30,LU:30,P:100,CN:30,CR:30,CSR:30,CSSR:30,CUR:30,CLR:30,RC:100});
function isReservedContentId(id){
 const m=String(id||'').match(/^(CSSR|CSR|CUR|CN|CR|LL|LU|RC|S|N|P)(\d+)$/);
 return !!(m&&+m[2]>=1&&+m[2]<=CONTENT_ID_LIMITS[m[1]]);
}
// @kokoryo-end-section S0002

// @kokoryo-section S0004

const KOKORYO_PACKS=window.KOKORYO_PACKS||{};
// @kokoryo-end-section S0004

// @kokoryo-section S0006

// Ver.2.77: イラストは表示名ではなく内部IDで紐付ける。画像未配置時は既存UIへ自動フォールバック。
const CONTENT_IMAGE_DIRS=Object.freeze({P:'images/characters/',CN:'images/cast/',CR:'images/cast/',CSR:'images/cast/',CSSR:'images/cast/',CUR:'images/cast/',CLR:'images/cast/',S:'images/cards/',N:'images/cards/',LL:'images/legends/',LU:'images/legends/'});
function contentBaseId(x){if(!x)return '';let raw=typeof x==='string'?x:(x.key||x.id||'');return String(raw).replace(/-\d+$/,'')}
// @kokoryo-end-section S0006

// @kokoryo-section S0014

const STD_BASE=[
{key:'S1',name:'作戦計画書',type:'S',special:'plan',vp:0,costText:'兵力2'},
{key:'S2',name:'人員調整書',type:'S',special:'adjust',vp:0,costText:'兵力4'},
{key:'S3',name:'制限令',type:'S',special:'restrict',vp:0,costText:'兵力3'},
{key:'S4',name:'特別許可書',type:'S',special:'permit',vp:0,costText:'兵力3'},
{key:'S5',name:'鉱山',type:'S',special:'mine',vp:1,costText:'🎲1/2＋資金2'},
{key:'S6',name:'農場',type:'S',special:'farm',vp:1,costText:'🎲3/4＋食料2'},
{key:'S7',name:'兵舎',type:'S',special:'barracks',vp:1,costText:'🎲5/6＋兵力2'},
{key:'S8',name:'司令室',type:'S',special:'commandroom',vp:1,costText:'🎲3/4＋資金3＋兵力1'},
{key:'S9',name:'倉庫',type:'S',special:'warehouse',vp:1,costText:'🎲1/3/5'},
{key:'S10',name:'教会',type:'S',special:'church',vp:1,costText:'🎲1/4＋資金3＋食料1'}
];
const NORMAL_BASE=mk('N','通常 ',15).map(c=>({...c,implemented:false})); NORMAL_BASE[0]={key:'N1',name:'ナーロッパランド',type:'N',special:'paneteria',vp:1}; NORMAL_BASE[1]={key:'N2',name:'領主会議',type:'N',special:'lordmeeting',vp:1,costText:'🎲1/6＋資金4'}; NORMAL_BASE[2]={key:'N3',name:'開拓ラッシュ',type:'N',special:'blackcasino',vp:1,costText:'🎲2＋🎲5＋食料5'};
NORMAL_BASE[3]={key:'N4',name:'大鉱山',type:'N',special:'greatermine',vp:2,costText:'🎲1＋🎲2＋資金5'};
NORMAL_BASE[4]={key:'N5',name:'大農園',type:'N',special:'greaterfarm',vp:2,costText:'🎲3＋🎲4＋食料5'};
NORMAL_BASE[5]={key:'N6',name:'要塞',type:'N',special:'greaterbarracks',vp:2,costText:'🎲5＋🎲6＋兵力5'};
NORMAL_BASE[6]={key:'N7',name:'大司令部',type:'N',special:'greatercommand',vp:2,costText:'🎲3＋🎲4＋資金4＋兵力2'};
NORMAL_BASE[7]={key:'N8',name:'飢饉',type:'N',special:'famine',vp:3,costText:'🎲3＋🎲3＋🎲3＋食料3'};
NORMAL_BASE[8]={key:'N9',name:'徴兵令',type:'N',special:'swordhunt',vp:2,costText:'🎲6＋兵力4'};
NORMAL_BASE[9]={key:'N10',name:'ナロパカルタ',type:'N',special:'laws',vp:1,costText:'資金5'};
NORMAL_BASE[10]={key:'N11',name:'オルフェンズ',type:'N',special:'graveyard',vp:0,costText:'🎲4/5＋食料1＋兵力2'};
NORMAL_BASE[11]={key:'N12',name:'納税',type:'N',special:'landgrab',vp:2,costText:'🎲2＋🎲5＋資金2＋食料2＋兵力2'};
NORMAL_BASE[12]={key:'N13',name:'義賊',type:'N',special:'bandit',vp:3,costText:'🎲ANY＋🎲ANY＋🎲ANY＋資金4＋食料3'};
NORMAL_BASE[13]={key:'N14',name:'交易場',type:'N',special:'publicmarket',vp:0,costText:'🎲ANY＋資金1＋食料1＋兵力1'};
NORMAL_BASE[14]={key:'N15',name:'スカウト',type:'N',special:'scout',vp:2,costText:'資金2＋食料2＋兵力2'};
NORMAL_BASE.slice(0,15).forEach(c=>c.implemented=true);
// Nカードのターン開始時フェイズ。効果のないカードには開始時フラグを付けない。
const N_NORMAL_START_SPECIALS=new Set(['mine','farm','barracks','commandroom','church','greatermine','greaterfarm','greaterbarracks','greatercommand','bandit','nanban','tenkucat']);
NORMAL_BASE.forEach(c=>{if(N_NORMAL_START_SPECIALS.has(c.special))c.turnStartTiming='normal'});
Object.values(KOKORYO_PACKS).forEach(pack=>(pack.normalCards||[]).forEach(c=>{let n=Number(String(c.key||'').replace(/^N/,''));if(n>=1){NORMAL_BASE[n-1]={...c,implemented:true,packId:pack.id,turnStartTiming:c.turnStartTiming||((typeof c.hooks?.turnStart==='function')?'normal':undefined)}}}));
const STD=copies(STD_BASE), NORMAL=copies(NORMAL_BASE.filter(c=>c.implemented));
// 固定デッキ定義。表示名とは別に内部IDで管理し、今後のデッキ追加・編集機能の土台にする。
const DECK_PRESETS={
 standard1:{id:'standard1',name:'スタンダード1',fixed:true,normalKeys:Array.from({length:15},(_,i)=>'N'+(i+1)),lowerLegendKeys:['LL1','LL2','LL3','LL4','LL5','LL6'],upperLegendKeys:['LU1','LU2','LU3','LU4','LU5','LU6']},
 standard2:{id:'standard2',name:'スタンダード2',fixed:true,normalKeys:['N2','N8','N9','N10','N15','N16','N17','N18','N19','N20','N21','N22','N23','N24','N25'],lowerLegendKeys:['LL4','LL5','LL6','LL7','LL8','LL9'],upperLegendKeys:['LU2','LU3','LU6','LU7','LU8','LU9']},
 standard3:{id:'standard3',name:'スタンダード3',fixed:true,normalKeys:['N4','N5','N6','N7','N15','N26','N27','N28','N29','N30','N31','N32','N33','N34','N35'],lowerLegendKeys:['LL4','LL5','LL6','LL10','LL11','LL12'],upperLegendKeys:['LU4','LU5','LU6','LU10','LU11','LU12']}
};
let customDeck={normalKeys:Array.from({length:15},(_,i)=>'N'+(i+1)),lowerLegendKeys:['LL1','LL2','LL3','LL4','LL5','LL6'],upperLegendKeys:['LU1','LU2','LU3','LU4','LU5','LU6']};
const CUSTOM_DECK_SAVE_KEY='kokoryo_custom_decks_v1';
function getSavedDecks(){try{let x=JSON.parse(localStorage.getItem(CUSTOM_DECK_SAVE_KEY)||'{}');return x&&typeof x==='object'&&!Array.isArray(x)?x:{}}catch(e){return {}}}
function putSavedDecks(x){try{localStorage.setItem(CUSTOM_DECK_SAVE_KEY,JSON.stringify(x));return true}catch(e){alert('デッキを保存できませんでした。ブラウザの保存領域を確認してください。');return false}}
function cloneCustomDeck(d=customDeck){return {normalKeys:[...(d.normalKeys||[])],lowerLegendKeys:[...(d.lowerLegendKeys||[])],upperLegendKeys:[...(d.upperLegendKeys||[])]}}
function refreshDeckSaveUI(selectName){let sel=q('#deckSaveSelect');if(!sel)return;let saves=getSavedDecks(),names=Object.keys(saves);sel.innerHTML='';if(!names.length){let o=document.createElement('option');o.value='';o.textContent='保存デッキなし';sel.appendChild(o);sel.disabled=true}else{sel.disabled=false;names.forEach(name=>{let o=document.createElement('option');o.value=name;o.textContent=name;sel.appendChild(o)});if(selectName&&saves[selectName])sel.value=selectName}q('#deckLoadBtn').disabled=!names.length;q('#deckDeleteBtn').disabled=!names.length}
function saveCustomDeck(){let input=q('#deckSaveName'),name=(input.value||'').trim();if(!name)return alert('デッキ名を入力してください。');if((customDeck.lowerLegendKeys||[]).length<6)return alert('Lower Legendは最低6種類採用してください。');let saves=getSavedDecks();if(saves[name]&&!turnClockConfirm('「'+name+'」を上書き保存しますか？'))return;saves[name]=cloneCustomDeck();if(putSavedDecks(saves)){input.value=name;refreshDeckSaveUI(name);alert('「'+name+'」を保存しました。')}}
function loadCustomDeck(){let name=q('#deckSaveSelect')?.value,saves=getSavedDecks(),d=saves[name];if(!d)return;customDeck=cloneCustomDeck(d);q('#deckSaveName').value=name;renderDeckEditor();alert('「'+name+'」を読み込みました。')}
function deleteCustomDeck(){let name=q('#deckSaveSelect')?.value,saves=getSavedDecks();if(!name||!saves[name])return;if(!turnClockConfirm('「'+name+'」を削除しますか？'))return;delete saves[name];if(putSavedDecks(saves)){refreshDeckSaveUI();alert('「'+name+'」を削除しました。')}}
function allCardsDeckConfig(){return {normalKeys:implementedNormalCards().map(c=>c.key),lowerLegendKeys:LEGEND_CATALOG.filter(c=>c.tier==='lower'&&isPackEnabled(c.packId)).map(c=>c.id),upperLegendKeys:LEGEND_CATALOG.filter(c=>c.tier==='upper'&&isPackEnabled(c.packId)).map(c=>c.id)}}
function activeDeckConfig(deckId){return deckId==='custom'?customDeck:deckId==='allcards'?allCardsDeckConfig():(DECK_PRESETS[deckId]||DECK_PRESETS.standard1)}
function standardDeckPresets(){return Object.values(DECK_PRESETS).filter(d=>d&&d.fixed)}
function standardDeckName(id){return DECK_PRESETS[id]?.name||'スタンダード1'}
function deckMissingCards(deckId){
 const cfg=DECK_PRESETS[deckId];if(!cfg)return [];
 const missing=[];
 (cfg.normalKeys||[]).forEach(key=>{let c=NORMAL_BASE.find(x=>x&&x.key===key);if(!c||!c.implemented||!isPackEnabled(c.packId))missing.push(key)});
 (cfg.lowerLegendKeys||[]).forEach(key=>{let c=LEGEND_CATALOG.find(x=>x.id===key);if(!c||!isPackEnabled(c.packId))missing.push(key)});
 (cfg.upperLegendKeys||[]).forEach(key=>{let c=LEGEND_CATALOG.find(x=>x.id===key);if(!c||!isPackEnabled(c.packId))missing.push(key)});
 return missing;
}
function deckPresetAvailable(deckId){return !deckMissingCards(deckId).length}
function refreshSetupDeckPreset(){let sel=q('#deckPreset');if(!sel)return;let cur=sel.value||'standard1';sel.innerHTML='';standardDeckPresets().forEach(d=>{let o=document.createElement('option');o.value=d.id;let missing=deckMissingCards(d.id);o.disabled=!!missing.length;o.textContent=d.name+'（固定）'+(missing.length?'［必要カード不足］':'');sel.appendChild(o)});let a=document.createElement('option');a.value='allcards';a.textContent='全カードデッキ';sel.appendChild(a);let c=document.createElement('option');c.value='custom';c.textContent='カスタムデッキ';sel.appendChild(c);if([...sel.options].some(o=>o.value===cur&&!o.disabled))sel.value=cur;else sel.value='standard1';q('#editDeck').disabled=sel.value!=='custom'}
// @kokoryo-end-section S0014

// @kokoryo-section S0016

function normalCardsForDeck(deckId){
 const keys=new Set(activeDeckConfig(deckId).normalKeys);
 return copies(NORMAL_BASE.filter(c=>c.implemented&&keys.has(c.key)&&isPackEnabled(c.packId)));
}
function implementedNormalCards(){return NORMAL_BASE.filter(c=>c.implemented&&isPackEnabled(c.packId))}
function clampedRandomizerCount(v){return Math.min(implementedNormalCards().length,Math.max(0,Math.floor(Number(v)||0)))}
function makeRandomizerCards(){if(!gameSettings.randomizerEnabled)return [];let count=clampedRandomizerCount(gameSettings.randomizerCount);return sh(implementedNormalCards()).slice(0,count).map((c,i)=>({...c,id:c.key+'-RND-'+(i+1)}))}
// @kokoryo-end-section S0016

// @kokoryo-section S0032


// Ver.0.3.55: 特殊カード設定駆動API＋追加パック拡張API。
function packRuntimeApi(owner=turn){
 return {
  owner, commands:commandApi(owner),
  get turn(){return turn}, get playerCount(){return playerCount},
  get powers(){return powers}, get commandCounts(){return commandCounts},
  get dice(){return dice}, get hands(){return hands}, get installed(){return installed},
  get temporary(){return temporary}, get employees(){return employees},
  get breadHands(){return breadHands}, get discard(){return discard},
  debtSupply(){return komePlace}, isFinalTurn(){return endgameStarter!==null||gameEnded}, canHire(){return (employees[turn]||[]).length<effectiveHireLimit()},
  hireNamedN(id){if((employees[turn]||[]).length>=effectiveHireLimit())return false;let e=packCastPool('N').find(x=>x.id===id);if(!e)return false;finalizeHire({...e},'《緊急補充人員》：');return true},
  notice(msg){if(msg)triggerNotices.push(String(msg))}, redraw(){renderGame()},
  resource(p,key,delta,source='effect'){if(!powers[p]||!['y','p','r'].includes(key))return false;if(delta>0)return gainResource(p,key,delta,source)>0;let next=powers[p][key]+delta;if(next<0)return false;powers[p][key]=next;return true},
  setResources(p,next){if(!powers[p])return false;for(const k of ['y','p','r']){const v=Math.max(0,+next[k]||0);if(v<=powers[p][k])powers[p][k]=v;else gainResource(p,k,v-powers[p][k],'effect')}return true},
  clearResources(p){if(!powers[p])return false;powers[p]={y:0,p:0,r:0};return true},
  debt(p){return commandCounts[p]||0},
  addDebt(p,n=1){return acquireDebt(p,n)},
  distributeDebt(target,n=1){return distributeDebt(owner,target,n)},
  distributeCommandsByQuota(target,quota){return distributeCommandsByQuota(owner,target,quota)},
  removeDebt(p,n=1){if(depressionDebtLocked(p))return 0;n=Math.max(0,Math.floor(+n||0));let take=Math.min(n,commandCounts[p]||0);commandCounts[p]-=take;komePlace+=take;return take},
  clearDebt(p){if(depressionDebtLocked(p))return 0;let n=commandCounts[p]||0;commandCounts[p]=0;komePlace+=n;return n},
  useDie(id){let d=dice.find(x=>x.id===+id&&!x.used);if(!d)return false;d.used=true;return true},
  useAnyCost(choice){return consumeCostChoice(choice)}, useNumberCost(choice,value){return consumeCostChoice(choice,value)},
  drawBread(p=owner){return drawBread(p)}, drawCard(){return drawOne()},
  install(p,card){registerInstallation(p,card)},
  discardInstalled(p,index){if(!installed[p]?.[index])return null;let c=installed[p].splice(index,1)[0];discard.push(c);return c},
  completeTurn(){completeEnd()}, cardPool(rarity){return packCastPool(rarity)}
 }
}
function runPackCardHook(card,name,ctx={}){
 let fn=card?.hooks?.[name]; if(typeof fn!=='function')return false;
 fn({...ctx,card,api:packRuntimeApi(ctx.owner??turn)}); return true
}
function runInstalledPackHooks(name,owner){
 [...(installed[owner]||[]),...(temporary[owner]||[])].forEach(card=>runPackCardHook(card,name,{owner}))
}
// @kokoryo-end-section S0032

// @kokoryo-section S0034

const KOKORYO_RULE_PACKS=window.KOKORYO_RULE_PACKS||{};
function enabledRuleCards(){return Object.values(KOKORYO_RULE_PACKS).filter(p=>gameSettings.enabledRulePacks?.includes(p.id)).flatMap(p=>p.ruleCards||[])}
function resolveActiveRuleCards(){let pool=enabledRuleCards();if(!pool.length){gameSettings.activeRuleCards=[];return []}let chosen=null;if(gameSettings.ruleCardMode==='random')chosen=pool[Math.floor(Math.random()*pool.length)];else chosen=pool.find(x=>x.id===gameSettings.ruleCardChoice)||pool[0];gameSettings.activeRuleCards=chosen?[chosen.id]:[];return chosen?[chosen]:[]}
function activeRuleCards(){let ids=gameSettings.activeRuleCards||[];return enabledRuleCards().filter(x=>ids.includes(x.id))}
function hasActiveRule(id){return activeRuleCards().some(rc=>rc.id===id)}
// @kokoryo-end-section S0034

// @kokoryo-section S0038

function captureLocalRuleSettings(){
 let chosenDeck=q('#deckPreset')?.value||'standard1';
 let maxLegend=legendSlotMax(chosenDeck);
 gameSettings.winVP=Math.max(1,Math.floor(Number(q('#settingWinVP')?.value)||20));
 if(q('#settingWinVP'))q('#settingWinVP').value=String(gameSettings.winVP);
 gameSettings.marketTypes=Math.max(1,Math.floor(Number(q('#settingMarketTypes')?.value)||8));
 gameSettings.initialResources=Math.max(0,Math.floor(Number(q('#settingInitialResources')?.value)||0));
 gameSettings.handLimit=Math.max(1,Math.floor(Number(q('#settingHandLimit')?.value)||6));
 gameSettings.hireLimit=Math.max(0,Math.floor(Number(q('#settingHireLimit')?.value)||0));
 gameSettings.legendSlots=Math.max(1,Math.min(maxLegend,Math.floor(Number(q('#settingLegendSlots')?.value)||3)));
 gameSettings.deckId=chosenDeck;
 return chosenDeck
}
// @kokoryo-end-section S0038

// @kokoryo-section S0042

function drawOne(){if(!deck.length&&discard.length){deck=sh(discard);discard=[]}let c=deck.shift()||null;if(c&&deck.length===0&&discard.length){deck=sh(discard);discard=[]}return c}
// @kokoryo-end-section S0042

// @kokoryo-section S0044

function refillMarket(){
 let target=Math.max(1,Math.floor(Number(gameSettings.marketTypes)||8));
 gameSettings.marketTypes=target;
 syncMarketTargetUI();
 let keys=new Set(market.map(c=>c.key));
 while(keys.size<target){
  let c=drawOne();if(!c)break;
  market.push(c);keys.add(c.key)
 }
}
function refillTo8(){refillMarket()}
const LEGEND_CATALOG=[
{id:'LU1',tier:'upper',name:'クラレント',vp:-5,special:'amanomurakumo',effectText:'このカードを設置したとき、即座にゲームを終了する。'},
{id:'LU2',tier:'upper',name:'ユグドラシル',vp:8,special:'mayqueen',effectText:'ターン開始時、自分の場にあるターン開始時効果を持つカードを1枚選んで、その効果を発動する。この効果を2回行う。'},
{id:'LU3',tier:'upper',name:'創世記',vp:0,special:'eggharp',effectText:'このカードを設置したとき、手札または公開カードから好きなカードを1枚選んで、コストを支払わずに設置する。この効果を4回行う。'},
{id:'LU4',tier:'upper',name:'シークレット・サーティーン',vp:3,special:'changeOfHeart',effectText:'このカードを設置したとき、他のプレイヤーの雇用キャラクターを1人選んで、自分の雇用キャラクターにする。このカードが場にある限り、雇用上限を1増やす。',cost:{y:24,r:0,p:0}},
{id:'LU5',tier:'upper',name:'神々の黄昏',vp:5,special:'resourceWipe',effectText:'ターン開始時、このカードの真下に下位レジェンドがない場合、コストを支払わずにこのカードを設置する。このカードを設置したとき、全てのプレイヤーは資源を全て捨てる。その後、このカードを設置したプレイヤーのターンを終了する。'},
{id:'LU6',tier:'upper',name:'パーフェクト・イミテーション',vp:10,special:'abilityCopy',effectText:'ターン開始時、場にいるキャラクターの固有能力を1つ選んで、このターン使用できる。ただし、初回限定の効果は発動しない。',allFaces:true,cost:{y:4,r:4,p:4}},
{id:'LL1',tier:'lower',name:'ミスリルラッシュ',vp:5,special:'legendmine',faces:[1,2],target:'鉱山',resource:'資金'},
{id:'LL2',tier:'lower',name:'ゴールデンフィールド',vp:5,special:'legendfarm',faces:[3,4],target:'農場',resource:'食料'},
{id:'LL3',tier:'lower',name:'エインヘリヤル',vp:5,special:'legendbarracks',faces:[5,6],target:'兵舎',resource:'兵力'},
{id:'LL4',tier:'lower',name:'ビギニング・オブ・レジェンド',vp:1,special:'talentRecruit',anyDice:4,cost:{y:20,r:0,p:0}},
{id:'LL5',tier:'lower',name:'ジェネシスワールド',vp:8,special:'scorchedEarth',allFaces:true,cost:{y:4,r:4,p:4}},
{id:'LL6',tier:'lower',name:'メモリークラッシュ',vp:2,special:'greatRefresh',anyDice:4,cost:{y:3,r:3,p:3}}
];
Object.values(KOKORYO_PACKS).forEach(pack=>(pack.legends||[]).forEach(L=>LEGEND_CATALOG.push({...L,packId:pack.id})));
function initLegends(){
 const cfg=activeDeckConfig(gameSettings.deckId),slots=Math.max(1,Math.min(legendSlotMax(gameSettings.deckId),gameSettings.legendSlots));
 let lowerPool=cfg.lowerLegendKeys.map(k=>LEGEND_CATALOG.find(x=>x.id===k)).filter(x=>x&&isPackEnabled(x.packId));
 let upperPool=cfg.upperLegendKeys.map(k=>LEGEND_CATALOG.find(x=>x.id===k)).filter(x=>x&&isPackEnabled(x.packId));
 let lowers=sh(lowerPool).slice(0,slots);
 const sets=[...new Set(lowerPool.map(x=>x.layoutSet).filter(Boolean))];
 for(const set of sets){let members=lowerPool.filter(x=>x.layoutSet===set),picked=members.filter(x=>lowers.some(y=>y.id===x.id));if(picked.length&&picked.length<members.length){if(slots<members.length){lowers=lowers.filter(x=>x.layoutSet!==set);while(lowers.length<slots){let c=sh(lowerPool.filter(x=>x.layoutSet!==set&&!lowers.some(y=>y.id===x.id)))[0];if(!c)break;lowers.push(c)}}else for(const m of members.filter(x=>!lowers.some(y=>y.id===x.id))){let i=lowers.findIndex(x=>x.layoutSet!==set);if(i>=0)lowers[i]=m}}}
 let uppers=[],usedUpper=new Set(),reserved=new Set(lowerPool.map(x=>x.pairedUpperId).filter(Boolean));
 for(const L of lowers){let U=L.pairedUpperId&&upperPool.find(x=>x.id===L.pairedUpperId&&!usedUpper.has(x.id));if(!U)U=sh(upperPool.filter(x=>!usedUpper.has(x.id)&&!reserved.has(x.id)))[0];if(U){uppers.push(U);usedUpper.add(U.id)}}
 let n=Math.min(lowers.length,uppers.length,slots);legends=[];for(let col=0;col<n;col++){legends.push({...uppers[col],col,taken:false,unlocked:false});legends.push({...lowers[col],col,taken:false,unlocked:true})}
}
// @kokoryo-end-section S0044

// @kokoryo-section S0102


function groups(){let m=new Map();market.forEach(c=>{if(!m.has(c.key))m.set(c.key,[]);m.get(c.key).push(c)});return m}
// @kokoryo-end-section S0102

// @kokoryo-section S0108

function takeMarket(key,dieId){let avail=unusedDice();if(!avail.length){selectedMarketKey=null;renderMarket();return;}if(!key||!groups().has(key))return alert('獲得する公開カードを選んでください。');if(!useDie(dieId))return alert('使用する未使用サイコロを選んでください。');let got=market.filter(c=>c.key===key);market=market.filter(c=>c.key!==key);hands[turn].push(...got);addDialog('P'+(turn+1)+'が公開場から「'+got[0].name+'」'+(got.length>1?'×'+got.length:'')+'を獲得しました。');marketUndoHistory.push({id:Date.now()+Math.random(),owner:turn,key,cards:[...got],dieId:+dieId,blocked:false});selectedMarketKey=null;renderGame()}
// @kokoryo-end-section S0108
