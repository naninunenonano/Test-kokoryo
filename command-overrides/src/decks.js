// Editing source only. Build with npm run build; do not load this file directly.
// Section order and the shared private scope are preserved by src/order.json.

// @kokoryo-section S0002

// コンテンツ内部IDの予約範囲。未実装IDの空データは作らず、追加パックから必要なIDだけ登録する。
const CONTENT_ID_LIMITS=Object.freeze({S:15,N:200,LL:30,LU:30,P:100,CN:30,CR:30,CSR:30,CSSR:30,CUR:30,CLR:30,RC:100});
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

// TEST237: stable effect identifiers and image identities survive the S/N renumbering.
const STANDARD_CARD_MIGRATIONS=Object.freeze({S1:'S1',S2:'S2',S5:'S3',S6:'S4',S7:'S5',S8:'S6',S9:'S7',S10:'S8',N1:'S9',N2:'S10',N3:'S11',N15:'S12',N26:'S13',N27:'S14',N29:'S15'});
const STD_BASE=[
{key:'S1',name:'作戦計画書',type:'S',special:'plan',vp:0,costText:'兵力2'},
{key:'S2',name:'人員調整書',type:'S',special:'adjust',vp:0,costText:'兵力4'},
{key:'S3',name:'鉱山',type:'S',special:'mine',vp:1,costText:'🎲1/2＋資金4',image:'images/cards/S5.png'},
{key:'S4',name:'農場',type:'S',special:'farm',vp:1,costText:'🎲3/4＋食料4',image:'images/cards/S6.png'},
{key:'S5',name:'兵舎',type:'S',special:'barracks',vp:1,costText:'🎲5/6＋兵力4',image:'images/cards/S7.png'},
{key:'S6',name:'司令室',type:'S',special:'commandroom',vp:2,costText:'🎲3/4＋資金4＋兵力2',image:'images/cards/S8.png'},
{key:'S7',name:'倉庫',type:'S',special:'warehouse',vp:1,costText:'🎲1/3/5',image:'images/cards/S9.png'},
{key:'S8',name:'教会',type:'S',special:'church',vp:2,costText:'🎲1/4＋資金4＋食料2',image:'images/cards/S10.png'},
{key:'S9',name:'ナーロッパランド',type:'S',special:'paneteria',vp:1,costText:'🎲ANY',image:'images/cards/N1.png'},
{key:'S10',name:'領主会議',type:'S',special:'lordmeeting',vp:2,costText:'🎲1/6＋資金6',image:'images/cards/N2.png'},
{key:'S11',name:'開拓ラッシュ',type:'S',special:'blackcasino',vp:0,costText:'🎲2＋🎲5＋食料5',image:'images/cards/N3.png'},
{key:'S12',name:'スカウト',type:'S',special:'scout',vp:2,costText:'資金2＋食料2＋兵力2',image:'images/cards/N15.png'}
];
for(const [oldKey,key] of [['N26','S13'],['N27','S14'],['N29','S15']]){
 const card=KOKORYO_PACKS.pack2?.normalCards?.find(c=>c.key===oldKey);
 if(!card)throw new Error('Missing standard card source '+oldKey);
 STD_BASE.push({...card,key,type:'S',image:'images/cards/'+oldKey+'.png',...(key==='S14'?{costText:'🎲3＋🎲4＋食料5',installSpec:{faces:[[3],[4]],resources:{p:5}}}:{})});
}
const NORMAL_BASE=Array.from({length:20},(_,i)=>({key:'N'+(i+1),name:'仮カードN'+(i+1),type:'N',vp:1,implemented:true,image:false,costText:'🎲ANY×1',effectText:'効果なし。',installSpec:{any:1}}));
const N_NORMAL_START_SPECIALS=new Set(['mine','farm','barracks','commandroom','church','greatermine','greaterfarm','greaterbarracks','greatercommand','bandit','nanban','tenkucat']);
STD_BASE.forEach(c=>{if(N_NORMAL_START_SPECIALS.has(c.special))c.turnStartTiming='normal'});
// Pack1 starts at N36 so its old N16–N20 cannot overwrite placeholders. Adopted pack2 cards exist once, as S cards.
Object.values(KOKORYO_PACKS).forEach(pack=>(pack.normalCards||[]).forEach(c=>{
 if(STANDARD_CARD_MIGRATIONS[c.key])return;
 const oldNumber=Number(String(c.key||'').replace(/^N/,'')),n=pack.id==='pack1'?oldNumber+20:oldNumber;
 if(n>20)NORMAL_BASE.push({...c,key:'N'+n,image:c.image||'images/cards/'+c.key+'.png',implemented:true,packId:pack.id,turnStartTiming:c.turnStartTiming||((typeof c.hooks?.turnStart==='function')?'normal':undefined)});
}));
const STD=copies(STD_BASE), NORMAL=copies(NORMAL_BASE.filter(c=>c.implemented));
// 固定デッキ定義。表示名とは別に内部IDで管理し、今後のデッキ追加・編集機能の土台にする。
const DECK_PRESETS={
 standard1:{id:'standard1',name:'スタンダード1',fixed:true,normalKeys:Array.from({length:20},(_,i)=>'N'+(i+1)),lowerLegendKeys:['LL1','LL2','LL3','LL4','LL5','LL6'],upperLegendKeys:['LU1','LU2','LU3','LU4','LU5','LU6']},
 standard2:{id:'standard2',name:'スタンダード2',fixed:true,normalKeys:['N2','N8','N9','N10','N36','N37','N38','N39','N40','N41','N42','N43','N44','N45'],lowerLegendKeys:['LL4','LL5','LL6','LL7','LL8','LL9'],upperLegendKeys:['LU2','LU3','LU6','LU7','LU8','LU9']},
 standard3:{id:'standard3',name:'スタンダード3',fixed:true,normalKeys:['N4','N5','N6','N7','N28','N30','N31','N32','N33','N34','N35'],lowerLegendKeys:['LL4','LL5','LL6','LL10','LL11','LL12'],upperLegendKeys:['LU4','LU5','LU6','LU10','LU11','LU12']}
};
let customDeck={normalKeys:Array.from({length:20},(_,i)=>'N'+(i+1)),lowerLegendKeys:['LL1','LL2','LL3','LL4','LL5','LL6'],upperLegendKeys:['LU1','LU2','LU3','LU4','LU5','LU6']};
const CUSTOM_DECK_SAVE_KEY='kokoryo_custom_decks_v2';
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
  canPayResources(p,cost){return canPayResourceCost(cost,p)},
  payResources(p,cost){return payResourceCost(cost,p)},
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
 gameSettings.winVP=ruleSettingValue('winVP',q('#settingWinVP')?.value);
 if(q('#settingWinVP'))q('#settingWinVP').value=String(gameSettings.winVP);
 gameSettings.marketTypes=ruleSettingValue('marketTypes',q('#settingMarketTypes')?.value);
 gameSettings.initialResources=ruleSettingValue('initialResources',q('#settingInitialResources')?.value);
 gameSettings.handLimit=Math.max(1,Math.floor(Number(q('#settingHandLimit')?.value)||10));
 gameSettings.hireLimit=ruleSettingValue('hireLimit',q('#settingHireLimit')?.value);
 gameSettings.legendSlots=Math.min(maxLegend,ruleSettingValue('legendSlots',q('#settingLegendSlots')?.value));
 gameSettings.deckId=chosenDeck;
 return chosenDeck
}
// @kokoryo-end-section S0038

// @kokoryo-section S0042

function drawOne(){if(!deck.length&&discard.length){deck=sh(discard);discard=[]}let c=deck.shift()||null;if(c&&deck.length===0&&discard.length){deck=sh(discard);discard=[]}return c}
// @kokoryo-end-section S0042

// @kokoryo-section S0044

function refillMarket(){
 let target=ruleSettingValue('marketTypes',gameSettings.marketTypes);
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
{id:'LU1',tier:'upper',name:'クラレント',vp:-8,special:'amanomurakumo',effectText:'このカードを設置したとき、即座にゲームを終了する。'},
{id:'LU2',tier:'upper',name:'ユグドラシル',vp:8,special:'mayqueen',effectText:'ターン開始時、自分の場にあるターン開始時効果を持つカードを1枚選んで、その効果を発動する。この効果を合計3回行う。'},
{id:'LU3',tier:'upper',name:'創世記',vp:0,special:'eggharp',effectText:'このカードを設置したとき、手札または公開カードから好きなカードを1枚選んで、コストを支払わずに設置する。この効果を4回行う。'},
{id:'LU4',tier:'upper',name:'シークレット・サーティーン',vp:5,special:'changeOfHeart',effectText:'このカードを設置したとき、他のプレイヤーの雇用キャラクターを1人選んで、自分の雇用キャラクターにする。このカードが場にある限り、雇用上限を1増やす。',cost:{y:18,r:0,p:0}},
{id:'LU5',tier:'upper',name:'神々の黄昏',vp:8,special:'resourceWipe',effectText:'ターン開始時、このカードの真下に下位レジェンドがない場合、コストを支払わずにこのカードを設置する。このカードを設置したとき、全てのプレイヤーは資源を全て捨てる。その後、このカードを設置したプレイヤーのターンを終了する。'},
{id:'LU6',tier:'upper',name:'パーフェクト・イミテーション',vp:8,special:'abilityCopy',effectText:'ターン開始時、場にいるキャラクターの固有能力を1つ選んで、このターン使用できる。ただし、初回限定の効果は発動しない。',distinctFaces:4,cost:{y:4,r:4,p:4}},
{id:'LL1',tier:'lower',name:'ミスリルラッシュ',vp:6,special:'legendmine',faces:[1,2],target:'鉱山',resource:'資金'},
{id:'LL2',tier:'lower',name:'ゴールデンフィールド',vp:6,special:'legendfarm',faces:[3,4],target:'農場',resource:'食料'},
{id:'LL3',tier:'lower',name:'エインヘリヤル',vp:6,special:'legendbarracks',faces:[5,6],target:'兵舎',resource:'兵力'},
{id:'LL4',tier:'lower',name:'ビギニング・オブ・レジェンド',vp:4,special:'talentRecruit',anyDice:3,cost:{y:15,r:0,p:0}},
{id:'LL5',tier:'lower',name:'ジェネシスワールド',vp:8,special:'scorchedEarth',distinctFaces:4,cost:{y:4,r:4,p:4}},
{id:'LL6',tier:'lower',name:'メモリークラッシュ',vp:5,special:'greatRefresh',anyDice:4,cost:{y:6,r:6,p:6}}
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
