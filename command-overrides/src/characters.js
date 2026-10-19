// Editing source only. Build with npm run build; do not load this file directly.
// Section order and the shared private scope are preserved by src/order.json.

// @kokoryo-section S0003

const CHARACTER_DATA={
 P1:{name:'築友城 トキ',title:'新米領主',gender:'男性',group:'hero',selectLabel:'トキ／さくら',uniqueAbility:'神の贈り物'},
 P2:{name:'築友城 さくら',title:'新米領主',gender:'女性',group:'hero',selectLabel:'トキ／さくら',uniqueAbility:'神の贈り物'},
 P3:{name:'トリスメギストス',title:'錬金術師',gender:'男性',group:'trismegistus',selectLabel:'トリスメギストス',uniqueAbility:'等価交換'},
 P4:{name:'トリスメギストス',title:'錬金術師',gender:'女性',group:'trismegistus',selectLabel:'トリスメギストス',uniqueAbility:'等価交換'},
 P5:{name:'リアン',title:'天才軍師',gender:'男性',group:'lian',selectLabel:'リアン',uniqueAbility:'神算鬼謀'},
 P6:{name:'リアン',title:'天才軍師',gender:'女性',group:'lian',selectLabel:'リアン',uniqueAbility:'神算鬼謀'},
 P7:{name:'シエル',title:'おねだり上手',gender:'男性',group:'ciel',selectLabel:'シエル',uniqueAbility:'おねだり'},
 P8:{name:'シエル',title:'おねだり上手',gender:'女性',group:'ciel',selectLabel:'シエル',uniqueAbility:'おねだり'},
 P9:{name:'レイン',title:'天才技師',gender:'男性',group:'rain',selectLabel:'レイン',uniqueAbility:'オーバークロック'},
 P10:{name:'レイン',title:'天才技師',gender:'女性',group:'rain',selectLabel:'レイン',uniqueAbility:'オーバークロック'},
 P11:{name:'ヴァレンタイン',title:'天才商人',gender:'男性',group:'valentine',selectLabel:'ヴァレンタイン',uniqueAbility:'神の見えざる手'},
 P12:{name:'ヴァレンタイン',title:'天才商人',gender:'女性',group:'valentine',selectLabel:'ヴァレンタイン',uniqueAbility:'神の見えざる手'}
};
const CHARACTER_FAMILIES=[
 {id:'hero',label:'トキ／さくら',versions:[
  {id:'rookie',label:'新米領主',male:'P1',female:'P2'}
 ]},
 {id:'trismegistus',label:'トリスメギストス',versions:[
  {id:'alchemist',label:'錬金術師',male:'P3',female:'P4'}
 ]},
 {id:'lian',label:'リアン',versions:[
  {id:'strategist',label:'天才軍師',male:'P5',female:'P6'}
 ]},
 {id:'ciel',label:'シエル',versions:[
  {id:'beggar',label:'おねだり上手',male:'P7',female:'P8'}
 ]},
 {id:'rain',label:'レイン',versions:[
  {id:'engineer',label:'天才技師',male:'P9',female:'P10'}
 ]},
 {id:'valentine',label:'ヴァレンタイン',versions:[
  {id:'merchant',label:'天才商人',male:'P11',female:'P12'}
 ]}
];
// Ver.0.3.77: 固有能力は本体で一元管理。追加パックは uniqueAbility 名だけを宣言する。
const UNIQUE_ABILITY_DEFS=Object.freeze({
 '神の贈り物':{text:'ターン開始時、サイコロを2個追加で振って獲得し、好きな資源を3個獲得する。',props:{extraDice:2,extraLordResource:3,chooseResource:true,amount:3}},
 '等価交換':{stackable:false,text:'ターン開始時に資金5を獲得する。資源コストは種類を問わず合計量で支払い、資源を参照する可変VPは全体で最適化する。資金・食料・兵力の獲得不可を無視する。',props:{exchangeRate:1,equivalentExchange:true}},
 '神算鬼謀':{text:'ターン開始時、命令書を2枚獲得する。この個体での初回発動時は、さらに4枚獲得する。',props:{turnBread:2,firstBreadBonus:4}},
 'おねだり':{text:'通常カードを設置するとき、必要なサイコロのうち好きな1つを使わずに設置できる。',props:{installDiceDiscount:1}},
 'オーバークロック':{copyable:false,stackable:true,text:'この個体での初回のみ、ターン開始時に好きな資源を合計20個、任意に配分して獲得する。この能力を持つ間、自分の最初の2ターンはレジェンドを獲得できない。',props:{overclockResources:20}},
 '神の見えざる手':{text:'ターン開始時、通常カードを2枚引く。通常手札を1枚捨て、好きな資源を2個獲得できる。',props:{invisibleHand:2}},
 'リクリエイション':{copyable:true,stackable:false,text:'自分の設置済み通常カード1枚を、VP差±2以内の通常手札1枚と入れ替えて仮設置する。設置時効果は発動する。レジェンドカードは対象外。',props:{recreationRange:2}},
 '無限の黄金':{copyable:false,stackable:false,text:'領主マイン・雇用ゴルドは10VPを持つ。雇用キャラクターの固有能力は無効化しない。この能力はコピーできない。',props:{copyable:false,uncopyable:true,vpOverride:10}},
 '神の恩恵':{text:'ターン開始時、サイコロを2個追加で獲得する。サイコロを好きな種類の資源に変換でき、サイコロ変換の獲得量を＋2する（基本3個から合計5個、命令書は対象外）。',props:{extraDice:2,dieResourceBonus:2,anyResourceDieConversionAmount:5}},
 '神託':{text:'通常雇用は通常コストで行う。1ターン合計3回まで、通常手札3枚を捨て、雇用1人を既定の1段階上へレベルアップする。そのたび、山札の上から通常カード1枚をコストなしで仮設置し、設置時効果を発動する。',props:{oracleUpgrade:true,oracleUses:3}},
 '貢ぎ物':{text:'ターン1回、通常手札のカード1枚を設置コストを支払わずに設置できる。この効果を使用したとき、命令書を1枚獲得する。この能力は所持している個体ごとに1回使用できる。',props:{tributeInstall:true}},
 'デッドマンズトリガー':{text:'ターン開始時、通常カード2枚と命令書2枚を獲得する。通常手札1枚を捨てて命令書1枚を獲得できる。重複可。',props:{deadMansTrigger:true,deadMansDraw:2,deadMansBread:2}},
 'クレシェンティア・ギフテッド':{copyable:false,stackable:false,text:'ターン開始時、好きな出目のサイコロ2個を獲得する。さらに、このCLRに設定された2つの固有能力を、それぞれ能力全体として得る。',props:{extraChosenDice:2}}
});
const ABILITY_ADD_KEYS=new Set(['extraDice','extraLordResource','dieResourceBonus','turnBread','firstBreadBonus','installDiceDiscount','invisibleHand','vp','extraChosenDice']);
function applyUniqueAbilityDef(entity){
 if(!entity)return entity;
 let out={...entity},names=[];
 if(out.uniqueAbility)names.push(out.uniqueAbility);
 if(Array.isArray(out.grantedAbilities))names.push(...out.grantedAbilities);
 let applied=new Set(Array.isArray(out._appliedUniqueAbilities)?out._appliedUniqueAbilities:[]);
 for(const name of names){
  if(applied.has(name))continue;
  let def=UNIQUE_ABILITY_DEFS[name];if(!def)continue;
  for(const [k,v] of Object.entries(def.props||{})){
   if(ABILITY_ADD_KEYS.has(k)&&typeof v==='number')out[k]=(+out[k]||0)+v;
   else if(k==='recreationRange'||k==='overclockResources')out[k]=Math.max(+out[k]||0,+v||0);
   else if(k==='exchangeRate')out[k]=out[k]==null?v:Math.min(+out[k]||99,+v||99);
   else if(k==='copyable'&&v===false)out[k]=false;
   else if(k==='uncopyable'&&v===true)out[k]=true;
   else if(typeof v==='boolean')out[k]=!!out[k]||v;
   else if(out[k]==null)out[k]=v;
  }
  applied.add(name);
 }
 out._appliedUniqueAbilities=[...applied];
 return out
}
// 《無限の黄金》は領主マインと雇用ゴルドで別の効果を持つ。
function isMineGoldLord(p){let lord=CHARACTER_DATA[charOf(p)];return !!lord&&lord.uniqueAbility==='無限の黄金'&&lord.name==='マイン'}
function employeeUniqueAbilitiesEnabled(p){return true}
function effectiveEmployeeAbility(e,p){if(employeeUniqueAbilitiesEnabled(p))return e;return {rarity:e.rarity,name:e.name,id:e.id,noCommonDie:e.noCommonDie};}
function abilityStackLabel(name){if(!name||!UNIQUE_ABILITY_DEFS[name])return '';return UNIQUE_ABILITY_DEFS[name].stackable===false?'重複不可':'重複可'}
function abilityStackTag(name){let label=abilityStackLabel(name);return label?' <span class="ability-stack-tag">'+label+'</span>':''}
function abilityStackText(name){let label=abilityStackLabel(name);return label?' 【'+label+'】':''}
function uniqueAbilityText(name){return UNIQUE_ABILITY_DEFS[name]?.text||''}
function abilityTextForEntity(entity){if(!entity)return '';let own=entity.uniqueAbility==='無限の黄金'?(entity.id==='CUR8'?'常時：このキャラクターは10VPを持つ。《パーフェクト・イミテーション》ではコピーできない。':entity.name==='マイン'?'常時：10VPを持つ。':''):uniqueAbilityText(entity.uniqueAbility);if(Array.isArray(entity.grantedAbilities)&&entity.grantedAbilities.length){let got=entity.grantedAbilities.map(x=>'《'+x+'》').join('＋');return own+(own?'\n':'')+'取得能力：'+got}return own}
// @kokoryo-end-section S0003

// @kokoryo-section S0005

Object.values(KOKORYO_PACKS).forEach(pack=>{
 Object.assign(CHARACTER_DATA,pack.characters||{});
 (pack.characterFamilies||[]).forEach(f=>{
  let existing=CHARACTER_FAMILIES.find(x=>x.id===f.id);
  if(existing){
   let known=new Set((existing.versions||[]).map(v=>v.id));
   (f.versions||[]).forEach(v=>{if(!known.has(v.id)){existing.versions.push({...v,packId:v.packId||f.packId||pack.id});known.add(v.id)}});
  }else{
   CHARACTER_FAMILIES.push({...f,packId:f.packId||pack.id,versions:(f.versions||[]).map(v=>({...v,packId:v.packId||f.packId||pack.id}))});
  }
 });
});
Object.keys(CHARACTER_DATA).forEach(id=>CHARACTER_DATA[id]=applyUniqueAbilityDef(CHARACTER_DATA[id]));
function isPackEnabled(id){return !id||!!gameSettings?.enabledPacks?.includes(id)}
function availableCharacterFamilies(){return CHARACTER_FAMILIES.filter(f=>isPackEnabled(f.packId)).map(f=>({...f,versions:(f.versions||[]).filter(v=>isPackEnabled(v.packId))})).filter(f=>(f.versions||[]).length)}
window.KOKORYO_CHARACTER_DATA=CHARACTER_DATA;
window.KOKORYO_CHARACTER_FAMILIES=CHARACTER_FAMILIES;
// 追加パックは CHARACTER_FAMILIES の対象キャラの versions に別バージョンを追加できる。
// 各バージョンごとに male / female のP-IDを指定し、最後に性別を選択する。
// キャスト予約ID：CN1-30 / CR1-30 / CSR1-30 / CSSR1-30 / CUR1-30。
// 領主予約ID：P1-100。
// スタンダードは8種類を複数枚採用し、合計30枚（N12 / R9 / SR6 / SSR3）。
const CLR_FUSION_RULES=[];
function registerCLRFusionRule(materials,result,stages=1){CLR_FUSION_RULES.push({materials:[...materials],result,...(stages===1?{}:{stages})})}
function clrFusionOptions(p=turn,stages=1){let st=employees[p]||[];return CLR_FUSION_RULES.filter(r=>(r.stages||1)===stages&&r.materials.every(id=>st.filter(e=>e.id===id).length>=r.materials.filter(x=>x===id).length)).map(r=>({rule:r}))}
const CLR_TYPES={
 CLR1:{id:'CLR1',name:'柊 歌音',title:'かけがえのない仲間',rarity:'CLR',uniqueAbility:'クレシェンティア・ギフテッド',abilityChoices:['神の贈り物','神の恩恵']},
 CLR2:{id:'CLR2',name:'榎 奏音',title:'かけがえのない仲間',rarity:'CLR',uniqueAbility:'クレシェンティア・ギフテッド',abilityChoices:['神の贈り物','神の恩恵']}
};
registerCLRFusionRule(['CUR1','CUR13'],'CLR1');
registerCLRFusionRule(['CUR9','CUR13'],'CLR2');
const CAST_TYPES={
 CN1:{id:'CN1',name:'一般会計',rarity:'N',resource:'y',amount:1},
 CN2:{id:'CN2',name:'一般料理人',rarity:'N',resource:'p',amount:1},
 CN3:{id:'CN3',name:'一般兵卒',rarity:'N',resource:'r',amount:1},
 CR1:{id:'CR1',name:'会計長',rarity:'R',resource:'y',amount:2},
 CR2:{id:'CR2',name:'料理長',rarity:'R',resource:'p',amount:2},
 CR3:{id:'CR3',name:'隊長',rarity:'R',resource:'r',amount:2},
 CSR2:{id:'CSR2',name:'財務官',rarity:'SR',resource:'y',amount:3,synthesisOnly:true},
 CSR3:{id:'CSR3',name:'宮廷料理人',rarity:'SR',resource:'p',amount:3,synthesisOnly:true},
 CSR4:{id:'CSR4',name:'将軍',rarity:'SR',resource:'r',amount:3,synthesisOnly:true},
 CSSR2:{id:'CSSR2',name:'財務総監',rarity:'SSR',resource:'y',amount:3,chooseDie:true,synthesisOnly:true},
 CSSR3:{id:'CSSR3',name:'総料理長',rarity:'SSR',resource:'p',amount:3,chooseDie:true,synthesisOnly:true},
 CSSR4:{id:'CSSR4',name:'大将軍',rarity:'SSR',resource:'r',amount:3,chooseDie:true,synthesisOnly:true},
 CSR1:{id:'CSR1',name:'執事',rarity:'SR',chooseResource:true,amount:2},
 CSSR1:{id:'CSSR1',name:'執事長',rarity:'SSR',chooseResource:true,amount:2,chooseDie:true},
 CUR1:{id:'CUR1',name:'柊 歌音',title:'もう1人の転移者',rarity:'UR',uniqueAbility:'神の贈り物',chooseDie:true,uniquePersonGroup:'kanon-kanato'},
 CUR2:{id:'CUR2',name:'パラケルスス',title:'錬金術師',rarity:'UR',uniqueAbility:'等価交換',chooseDie:true},
 CUR3:{id:'CUR3',name:'シアン',title:'かわいいスパイラル',rarity:'UR',uniqueAbility:'おねだり',chooseDie:true},
 CUR4:{id:'CUR4',name:'ビスマルク',title:'天才軍師',rarity:'UR',uniqueAbility:'神算鬼謀',chooseDie:true},
 CUR5:{id:'CUR5',name:'アローン',title:'孤独な機械',rarity:'UR',uniqueAbility:'オーバークロック',chooseDie:true},
 CUR6:{id:'CUR6',name:'ジル',title:'天才商人',rarity:'UR',uniqueAbility:'神の見えざる手',chooseDie:true}
};
Object.assign(CAST_TYPES,CLR_TYPES);
Object.values(KOKORYO_PACKS).forEach(pack=>Object.entries(pack.casts||{}).forEach(([id,e])=>CAST_TYPES[id]={...e,packId:pack.id}));
Object.keys(CAST_TYPES).forEach(id=>CAST_TYPES[id]=applyUniqueAbilityDef(CAST_TYPES[id]));
function castCopies(id,n){return Array.from({length:n},(_,i)=>({...CAST_TYPES[id],copy:i+1,instanceId:id+'-'+(i+1)}))}
function castDisplayName(e){if(!e)return '';if(e.rarity==='CLR')return e.name;return e.rarity==='UR'?(e.title?'《'+e.title+'》'+e.name:e.name):e.name}
// @kokoryo-end-section S0005

// @kokoryo-section S0008

const CAST_GACHA_RATES=[['N',60],['R',20],['SR',11],['SSR',6],['UR',3]];
// UR＝Unique Rare（ユニークレア）。正式実装済みだが、スタンダードでもURを含む14種を通常ガチャから排出。追加パック側から排出IDを追加できる。
// URは固有キャスト。同じURキャストはゲーム中に1人しか雇用できず、獲得済みURは以後の抽選候補から除外する。
const STANDARD_CAST_IDS=['CN1','CN2','CN3','CR1','CR2','CR3','CSR1','CSSR1','CUR1','CUR2','CUR3','CUR4','CUR5','CUR6'];
const SYNTHESIS_CAST_IDS=['CSR2','CSR3','CSR4','CSSR2','CSSR3','CSSR4'];
const IMPLEMENTED_CAST_IDS=[...new Set([...STANDARD_CAST_IDS,...SYNTHESIS_CAST_IDS])];
let ACTIVE_CAST_IDS=[...STANDARD_CAST_IDS];
function isUniqueRareAlreadyHired(id){let target=CAST_TYPES[id];if(target?.doppelUniqueException)return false;let group=target&&target.uniquePersonGroup;return employees.some(list=>(list||[]).some(e=>e&&e.rarity==='UR'&&(e.id===id||(group&&e.uniquePersonGroup===group)||(target&&e.name===target.name))))}
function availableCastPool(ids,rarity){return ids.map(id=>CAST_TYPES[id]).filter(x=>x&&x.rarity===rarity&&(rarity!=='UR'||!isUniqueRareAlreadyHired(x.id)))}
function implementedCastPool(rarity){let ids=[...ACTIVE_CAST_IDS];Object.values(KOKORYO_PACKS).forEach(pack=>{if(isPackEnabled(pack.id))ids.push(...(pack.castIds||Object.keys(pack.casts||{})))});return availableCastPool([...new Set(ids)].filter(id=>!CAST_TYPES[id]?.synthesisOnly),rarity)}
function allImplementedCastPool(rarity){return availableCastPool(IMPLEMENTED_CAST_IDS,rarity)}
function addCastPack(ids=[]){ids.forEach(id=>{if(CAST_TYPES[id]&&!ACTIVE_CAST_IDS.includes(id))ACTIVE_CAST_IDS.push(id)})}
function rollCastRarity(){
 // 候補切れのレアリティを引いた場合は、実装済みレアリティが出るまで再抽選する。
 while(true){let r=Math.random()*100,acc=0;for(let [rarity,rate] of CAST_GACHA_RATES){acc+=rate;if(r<acc){if(implementedCastPool(rarity).length)return rarity;break}}}
}
function randomCastOfRarity(rarity){let pool=implementedCastPool(rarity);return pool.length?{...pool[Math.floor(Math.random()*pool.length)]}:null}
function gachaCast(){return randomCastOfRarity(rollCastRarity())}

function charOf(p){return characters[p]||'P1'}
function lordPortraitPath(charId){return /^P(?:[1-9]|[1-9]\d|100)$/.test(String(charId||''))?'images/characters/'+charId+'.png':''}
// @kokoryo-end-section S0008

// @kokoryo-section S0010

function characterFamily(id){let a=availableCharacterFamilies();return a.find(x=>x.id===id)||a[0]||CHARACTER_FAMILIES[0]}
function characterVersion(family,id){return family.versions.find(x=>x.id===id)||family.versions[0]}
// @kokoryo-end-section S0010

// @kokoryo-section S0012

function selectedCharacterIds(){
 return [...document.querySelectorAll('#characterSelects .char-row')].map(row=>{let fam=characterFamily(row.dataset.family),ver=characterVersion(fam,row.dataset.version),sex=row.dataset.gender||'male';return ver[sex]||ver.male||ver.female})
}
// @kokoryo-end-section S0012

// @kokoryo-section S0017

let nextHireMinRarity=null,nextHireExtra=0,fusionUsedThisTurn=false;
// @kokoryo-end-section S0017

// @kokoryo-section S0028

function lordInstallDiceDiscount(){return cardCommands.discount('install','dice',0,{sources:characterEffectSources(turn).map(s=>s.installDiceDiscount||0).concat(copiedAbility==='おねだり'?1:0)})}
// @kokoryo-end-section S0028

// @kokoryo-section S0035

function effectiveHireLimit(p=turn){let bonus=hasActiveRule('RC3')?1:0;for(const c of allFieldCards(p))if(c.special==='hireCapacity'||c.special==='bigCompany'||c.special==='changeOfHeart')bonus++;return cardCommands.limit('hire',bonus)}
function isHireFree(){return hasActiveRule('RC3')}
// @kokoryo-end-section S0035

// @kokoryo-section S0050

function resolveReactiveRolls(acquired=dice,clearNotices=true){
 if(clearNotices)triggerNotices=[];
 const defs=[
  {special:'laws',face:1,color:'y',name:'ナロパカルタ',resource:'資金'},
  {special:'famine',face:3,color:'p',name:'飢饉',resource:'食料'},
  {special:'swordhunt',face:6,color:'r',name:'徴兵令',resource:'兵力'}
 ];
 defs.forEach(def=>{
  cardCommands.trigger('dice-acquired',{actor:turn,items:acquired},{aggregate:true,when:owner=>owner!==turn,
   match:d=>d.value===def.face,instances:owner=>cardCommands.count({zone:'installed',owner},c=>c.special===def.special),
   effect:({owner,hits,occurrences})=>{
    let actual=acquireDebt(turn,occurrences*2);
    let gain=playerScaledGain()*occurrences;gainResource(owner,def.color,gain,'effect');
    triggerNotices.push(def.name+'発動：P'+(turn+1)+'が'+def.face+'の目を'+hits+'個出したため、P'+(turn+1)+'は負債を'+actual+'枚獲得。P'+(owner+1)+'は'+def.resource+'を'+gain+'個獲得。');
   }});
 });
}
// @kokoryo-end-section S0050

// @kokoryo-section S0053

function characterEffectSources(p){let a=[],lord=CHARACTER_DATA[charOf(p)];if(lord)a.push(lord);(employees[p]||[]).forEach(e=>{if(e)a.push(effectiveEmployeeAbility(e,p))});return a}
function isLegendCard(c){return !!c&&(c.type==='LEGEND'||c.tier==='upper'||c.tier==='lower'||/^L[LU]\d+$/.test(c.key||c.id||''))}
function legendAcquisitionAllowed(p=turn){
 const overclock=characterEffectSources(p).some(x=>x.uniqueAbility==='オーバークロック'||x.grantedAbilities?.includes('オーバークロック'))||(p===turn&&copiedAbility==='オーバークロック');
 return !overclock||(+playerTurnCounts[p]||0)>=3;
}
function hasEquivalentExchange(p=turn){return characterEffectSources(p).some(x=>x.uniqueAbility==='等価交換'||x.grantedAbilities?.includes('等価交換'))||(p===turn&&copiedAbility==='等価交換')}
function stackedNumericEffect(p,key){let total=0,groups=new Map();characterEffectSources(p).forEach(x=>{let v=+x[key]||0;if(!v)return;if(x.effectStackGroup)groups.set(x.effectStackGroup,Math.max(groups.get(x.effectStackGroup)||0,v));else total+=v});groups.forEach(v=>total+=v);return total}
function groupedCharacterVP(p){let values=[],groups=new Map();characterEffectSources(p).forEach(x=>{let v=+(x.vpOverride??x.vp)||0;if(!v)return;if(x.vpStackGroup)groups.set(x.vpStackGroup,Math.max(groups.get(x.vpStackGroup)||0,v));else values.push(v)});return cardCommands.function({target:values.concat([...groups.values()]),value:v=>v})}

// @kokoryo-end-section S0053

// @kokoryo-section S0056

function hasGodBlessingForTurn(){return copiedAbility==='神の恩恵'||characterEffectSources(turn).some(x=>x?.uniqueAbility==='神の恩恵')}
// @kokoryo-end-section S0056

// @kokoryo-section S0059

function fieldUniqueAbilities(){
 let set=new Set();for(let p=0;p<playerCount;p++){
  let sources=[CHARACTER_DATA[charOf(p)],...(employees[p]||[])];
  sources.forEach(x=>{let a=x?.uniqueAbility,def=UNIQUE_ABILITY_DEFS[a];if(!a||!def||def.copyable===false||x.copyable===false||x.uncopyable)return;set.add(a)})
 }
 return [...set]
}
function abilityProfile(name){if(!name)return null;let def=UNIQUE_ABILITY_DEFS[name];if(def)return applyUniqueAbilityDef({uniqueAbility:name});for(const x of Object.values(CHARACTER_DATA))if(x?.uniqueAbility===name)return x;for(const x of Object.values(CAST_TYPES))if(x?.uniqueAbility===name)return x;return null}
function recreationRangeForTurn(){let vals=[];let lord=CHARACTER_DATA[charOf(turn)];if(lord?.recreationRange)vals.push(lord.recreationRange);(employeeUniqueAbilitiesEnabled(turn)?(employees[turn]||[]):[]).forEach(e=>{if(e?.recreationRange)vals.push(e.recreationRange)});let cp=abilityProfile(copiedAbility);if(cp?.recreationRange)vals.push(cp.recreationRange);return vals.length?Math.max(...vals):0}
function resolveAbilityCopyLegend(onDone){
 const copyCard=installed[turn].find(c=>c.special==='abilityCopy');if(!copyCard||!cardCommands.once(1,'turn',{usage:stdAbilityUsed,cardId:'copy:'+commandInstanceId(copyCard)}))return false;
 let opts=fieldUniqueAbilities();if(!opts.length)return false;
 const owner=turn;turnClockChoice={kind:'copy'};
 const m=q('#legendChoiceModal'),grid=q('#legendChoiceCards');
 q('#legendChoiceTitle').textContent='パーフェクト・イミテーション';
 q('#legendChoiceNote').textContent='このターン使用する固有能力を選んでください。';
 grid.innerHTML='';
 const sel=document.createElement('select');sel.style.cssText='width:100%;padding:12px;margin:10px 0';
 opts.forEach((name,i)=>{const o=document.createElement('option');o.value=String(i);o.textContent='《'+name+'》';sel.appendChild(o)});
 const ok=document.createElement('button');ok.textContent='決定';ok.className='primary';
 const choiceToken=turnClockState?.token;const allowed=()=>turnClockLeaseValid(owner,choiceToken)&&(!(onlineDebugMode||realOnlineMainMode)||viewer===owner);
 ok.disabled=!allowed();sel.disabled=!allowed();
 ok.onclick=()=>{
  if(!allowed()||turn!==owner)return;
  const chosen=cardCommands.choice(opts,1,{select:[Number(sel.value)]})[0];if(!chosen)return;if(!cardCommands.once(1,'turn',{usage:stdAbilityUsed,cardId:'copy:'+commandInstanceId(copyCard),consume:true}))return;
  m.classList.add('hidden');turnClockChoice=null;cardCommands.copy(chosen,{applyStart:true});
  triggerNotices.push('《パーフェクト・イミテーション》：《'+copiedAbility+'》をコピーしました。');
  if(onDone)onDone();
 };
 grid.append(sel,ok);q('#legendChoiceCancel').onclick=()=>{};
 q('#legendChoiceCancel').style.display='none';m.classList.remove('hidden');
 return true;
}
// @kokoryo-end-section S0059

// @kokoryo-section S0069

function handCardLikelyInstallable(c){if(balancedInstallCost(c)){const choices=balancedCostChoices(c);const base={greatermine:'mine',greaterfarm:'farm',greaterbarracks:'barracks',greatercommand:'commandroom'}[c.special];return !!(choices&&balancedCostValid(c,choices)||base&&installed[turn].some(x=>x.special===base)&&balancedCostValid(c,[],{upgrade:true}))}let p=powers[turn],opts=n=>installCostOptions(n).length,any=()=>installCostOptions(null).length;if(c.installSpec){let spec=c.installSpec;return canPayResourceCost(spec.resources||{})&&installCostOptions(null).length>=((spec.faces||[]).length+(typeof spec.any==='function'?spec.any({owner:turn,card:c,api:packRuntimeApi(turn)}):(+spec.any||0)))}if(c.type==='S'&&['plan','adjust','restrict','permit','mine','farm','barracks','commandroom','warehouse','church'].includes(c.special)){let need={plan:[0,2,0,0],adjust:[0,4,0,0],restrict:[0,3,0,0],permit:[0,3,0,0],mine:[2,0,0,1],farm:[0,0,2,3],barracks:[0,2,0,5],commandroom:[3,1,0,3],warehouse:[0,0,0,1],church:[3,0,1,1]}[c.special];if(!need)return true;if(!canPayResourceCost({["y"]:(need[0]),["r"]:(need[1]),["p"]:(need[2])},turn))return false;let faces={mine:[1,2],farm:[3,4],barracks:[5,6],commandroom:[3,4],warehouse:[1,3,5],church:[1,4]}[c.special];return !faces||faces.some(v=>opts(v)>0)}if(c.special==='laws')return canPayResourceCost({["y"]:(5)},turn);if(c.special==='scout')return canPayResourceCost({["y"]:(2),["r"]:(2),["p"]:(2)},turn)&&(employees[turn]||[]).length<gameSettings.hireLimit;if(c.special==='famine')return canPayResourceCost({["p"]:(3)},turn)&&opts(3)>=3;if(c.special==='swordhunt')return canPayResourceCost({["r"]:(4)},turn)&&opts(6)>0;if(c.special==='graveyard')return canPayResourceCost({["p"]:(1),["r"]:(2)},turn)&&(opts(4)+opts(5)>0);if(c.special==='landgrab')return canPayResourceCost({["y"]:(2),["r"]:(2),["p"]:(2)},turn)&&opts(2)>0&&opts(5)>0;if(c.special==='bandit')return canPayResourceCost({["y"]:(4),["p"]:(3)},turn)&&any()>=3;if(c.special==='publicmarket')return canPayResourceCost({["y"]:(1),["r"]:(1),["p"]:(1)},turn)&&any()>0;if(c.special==='lordmeeting')return canPayResourceCost({["y"]:(4)},turn)&&(opts(1)+opts(6)>0);if(c.special==='blackcasino')return canPayResourceCost({["p"]:(5)},turn)&&opts(2)>0&&opts(5)>0;if(c.special==='cursedclock')return canPayResourceCost({["p"]:(3)},turn)&&(opts(5)+opts(6)>0);if(c.special==='ninjaguild')return canPayResourceCost({["y"]:(5)},turn)&&(opts(1)+opts(2)>0);if(c.special==='paneteria')return any()>0;if(c.special==='elekiter')return canPayResourceCost({["y"]:(1),["r"]:(1),["p"]:(1)},turn)&&opts(2)>0&&opts(5)>0;if(c.special==='nanban')return canPayResourceCost({["y"]:(2),["r"]:(2),["p"]:(2)},turn)&&any()>=2;if(c.special==='tenkucat')return canPayResourceCost({["y"]:(2),["r"]:(1),["p"]:(2)},turn)&&opts(1)>0&&opts(6)>0&&installed[turn].length>0;if(c.special==='treasureship')return hasEquivalentExchange(turn)?canPayResourceCost({y:30}):Math.max(p.y,p.r,p.p)>=30;if(c.special==='inadamashii')return installed[turn].length>=8;return true}
// @kokoryo-end-section S0069

// @kokoryo-section S0071

function hasSameOwnedUniqueAbility(e,p=turn){
 if(!e||!e.uniqueAbility)return false;
 let lord=CHARACTER_DATA[charOf(p)];
 if(lord&&lord.uniqueAbility===e.uniqueAbility)return true;
 return (employees[p]||[]).some(x=>x&&x.uniqueAbility===e.uniqueAbility);
}
function sameUniqueAbilityAsLord(e,p=turn){return hasSameOwnedUniqueAbility(e,p)}
function redrawSameRarityCast(e){let pool=implementedCastPool(e.rarity).filter(x=>x.id!==e.id);if(!pool.length)pool=allImplementedCastPool(e.rarity).filter(x=>x.id!==e.id);return pool.length?{...pool[Math.floor(Math.random()*pool.length)]}:null}
function resolveDoppelCopy(e){if(!e?.doppelganger)return e;let targets=[];for(let p=0;p<playerCount;p++)(employees[p]||[]).forEach((x,i)=>{if(x&&x.rarity===e.rarity&&!x.doppelganger)targets.push({p,i,x})});if(!targets.length){e.copiedFrom=null;return e}let msg=targets.map((t,i)=>(i+1)+'. P'+(t.p+1)+' '+castDisplayName(t.x)).join('\n');let n=Math.floor(+(botIsPlayer(turn)?'1':turnClockPrompt('《ドッペルゲンガー》\nコピーする同レアリティの雇用キャラクターを選んでください。\n\n'+msg,'1')||0));if(!n||!targets[n-1]){e.copiedFrom=null;return e}let src=targets[n-1].x;let copied={...e,copiedFrom:src.id,uniqueAbility:src.uniqueAbility,abilityText:castEffectText(src),copySourceName:castDisplayName(src)};return applyUniqueAbilityDef(copied) }
function finalizeHire(e,label=''){
 e=resolveDoppelCopy(e);employees[turn].push(e);if(employeeUniqueAbilitiesEnabled(turn)&&e.hireBread){for(let i=0;i<e.hireBread;i++)drawBread(turn);}
 let agency=allFieldCards(turn).filter(c=>c.special==='staffingAgency').length;if(agency){for(let i=0;i<agency;i++){drawBread(turn);let gain=playerCount>=4?1:playerCount===3?2:3;gainResource(turn,'y',gain,'effect');gainResource(turn,'p',gain,'effect');gainResource(turn,'r',gain,'effect')}}
 triggerNotices.push((label||('P'+(turn+1)+'が '))+e.rarity+'「'+e.name+'」を雇用しました。ダイス増加は次の自分のターンから適用されます。');renderGame();
}
function hireEmployee(dieId){
 if(!isViewingOwnTurn())return alert('相手ターン中は雇用できません。');
 if(hiredThisTurn)return alert('雇用は1ターンに1回までです。');
 if((employees[turn]||[]).length>=effectiveHireLimit())return alert('雇用できる部下は最大'+effectiveHireLimit()+'人です。');
 if(!isHireFree()){
  if(!canPayResourceCost({["y"]:(5)},turn))return alert('雇用には資金5が必要です。');
  let d=useDie(dieId);if(!d)return alert('未使用のサイコロを1個選んでください。');
  payResourceCost({["y"]:(5)},turn);
 }
 return cardCommands.koyou('gacha',1,{accept:e=>{if(nextHireMinRarity){let order=['N','R','SR','SSR','UR'],min=order.indexOf(nextHireMinRarity);let pool=packCastPool(nextHireMinRarity).concat(...order.slice(min+1).map(r=>packCastPool(r)));if(pool.length)e={...pool[Math.floor(Math.random()*pool.length)]};nextHireMinRarity=null;}if(!e)return alert('雇用できるキャストが実装されていません。');
 // 通常は即雇用。URかつ、すでに所持しているキャラと固有能力が同名の場合だけ再抽選を選べる。
 if(e.rarity==='UR'&&hasSameOwnedUniqueAbility(e)){
  let nextPool=implementedCastPool('UR').filter(x=>x.id!==e.id);
  if(!nextPool.length)nextPool=allImplementedCastPool('UR').filter(x=>x.id!==e.id);
  if(nextPool.length&&turnClockConfirm('UR「'+castDisplayName(e)+'」の《'+e.uniqueAbility+'》は、すでに所持しているキャラと同名です。\nこのURを雇用せず、同じURから再抽選しますか？')){
   e={...nextPool[Math.floor(Math.random()*nextPool.length)]};
  }
 }
 // 効果による雇用は通常の雇用回数を消費しないため、通常雇用側で記録する。
 hiredThisTurn=true;
 finalizeHire(e);
 }}).length>0;
}
function gainSSRDie(value){if(pendingSSRBonus<=0)return;let v=+value;if(v<1||v>6)return;cardCommands.dice('gain',{value:v,source:'SSR'});pendingSSRBonus--;renderGame()}
function gainCastResource(color){if(!pendingCastResourceChoices.length)return;if(!eraGainAllowed(turn,color,'effect'))return;let x=pendingCastResourceChoices.shift();cardCommands.pool(color,x.amount);playLogAction('character_ability',{ability:'cast_resource',color,gained:x.amount});renderGame()}
function gainOverclockResource(color){if(!pendingOverclockChoices.length)return;if(!eraGainAllowed(turn,color,'effect'))return;let x=pendingOverclockChoices[0];cardCommands.pool(color,1);playLogAction('character_ability',{ability:'オーバークロック',color,gained:1});x.remaining--;if(x.remaining<=0)pendingOverclockChoices.shift();renderGame()}
// @kokoryo-end-section S0071

// @kokoryo-section S0073

function employeeCardView(e){
 let w=document.createElement('div');w.className='employee-card';
 let src=resolvedContentImage(e);
 let img=document.createElement('img');img.className='employee-card-image zoomable';img.src=src;img.alt=castDisplayName(e);
 img.onerror=()=>{let ph=document.createElement('div');ph.className='employee-card-image-missing';ph.textContent='NO IMAGE';img.replaceWith(ph)};
 if(src)w.appendChild(img);else{let ph=document.createElement('div');ph.className='employee-card-image-missing';ph.textContent='NO IMAGE';w.appendChild(ph)}
 let meta=document.createElement('div');meta.className='employee-card-meta';
 let rarity=document.createElement('div');rarity.className='employee-card-rarity';rarity.textContent=e.rarity==='CLR'?'LR':(e.rarity||'');
 let name=document.createElement('strong');name.className='employee-card-name';name.textContent=castDisplayName(e);
 meta.append(rarity,name);
 if(e.uniqueAbility){let a=document.createElement('div');a.className='employee-card-ability';a.innerHTML='《'+escapeHtml(e.uniqueAbility)+'》'+abilityStackTag(e.uniqueAbility);meta.appendChild(a)}
 let ef=document.createElement('div');ef.className='employee-card-effect';ef.textContent=castEffectText(e);meta.appendChild(ef);
 w.appendChild(meta);return w;
}
const CAST_SYNTHESIS={CN1:'CR1',CN2:'CR2',CN3:'CR3',CR1:'CSR2',CR2:'CSR3',CR3:'CSR4',CSR2:'CSSR2',CSR3:'CSSR3',CSR4:'CSSR4',CSR1:'CSSR1'};
Object.values(KOKORYO_PACKS).forEach(pack=>Object.assign(CAST_SYNTHESIS,pack.castSynthesis||{}));
function chooseLRAbilities(base,onDone){
 let choices=[...(base?.abilityChoices||[])];
 let need=Math.min(2,choices.length);
 if(!need){onDone(applyUniqueAbilityDef({...base,grantedAbilities:[]}));return}
 if(botIsPlayer(turn)){onDone(applyUniqueAbilityDef({...base,grantedAbilities:choices.slice(0,need)}));return}
 let modal=q('#lrAbilitySelectModal');
 if(!modal){
  modal=document.createElement('div');modal.id='lrAbilitySelectModal';modal.className='imgmodal hidden';modal.style.zIndex='10030';
  modal.innerHTML='<div style="background:#fff;color:#222;border-radius:12px;padding:16px;max-width:720px;width:94vw;max-height:88vh;overflow:auto"><strong>LR獲得：固有能力を選択</strong><div id="lrAbilitySelectNote" class="small" style="margin:8px 0"></div><div id="lrAbilitySelectList" style="display:grid;gap:8px"></div><div class="row" style="justify-content:flex-end;margin-top:14px"><button id="lrAbilitySelectCancel" type="button" class="secondary">キャンセル</button><button id="lrAbilitySelectOk" type="button" class="primary">決定</button></div></div>';
  document.body.appendChild(modal)
 }
 let note=q('#lrAbilitySelectNote'),list=q('#lrAbilitySelectList'),ok=q('#lrAbilitySelectOk'),cancel=q('#lrAbilitySelectCancel');
 note.textContent='《クレシェンティア・ギフテッド》で獲得する固有能力を'+need+'つ選んでください。';
 list.innerHTML='';
 let selected=new Set();
 choices.forEach(name=>{
  let row=document.createElement('label');row.style.cssText='display:flex;gap:8px;align-items:flex-start;border:1px solid #ccc;border-radius:10px;padding:10px;cursor:pointer';
  let cb=document.createElement('input');cb.type='checkbox';cb.value=name;
  let txt=document.createElement('div');txt.innerHTML='<strong>《'+escapeHtml(name)+'》</strong><div class="small" style="margin-top:3px">'+escapeHtml(uniqueAbilityText(name)||'効果説明なし')+'</div>';
  cb.onchange=()=>{if(cb.checked){if(selected.size>=need){cb.checked=false;return}selected.add(name)}else selected.delete(name);ok.disabled=selected.size!==need};
  row.append(cb,txt);list.appendChild(row)
 });
 ok.disabled=true;
 let close=()=>{modal.classList.add('hidden');ok.onclick=null;cancel.onclick=null};
 cancel.onclick=close;
 ok.onclick=()=>{if(selected.size!==need)return;let made=applyUniqueAbilityDef({...base,grantedAbilities:[...selected]});close();onDone(made)};
 modal.classList.remove('hidden')
}
function growthPromotionActive(){return hasActiveRule('RC5')}
function normalFusionMaterialCount(){return growthPromotionActive()?1:2}
// Stages follow registered edges without creating intermediate employees.
function castEvolution(id,stages=1,{fusion=false}={}){
 if(!Number.isSafeInteger(stages)||stages<1)return null;
 const edges=fusion?CAST_SYNTHESIS:{...ORACLE_UPGRADE_MAP,...CAST_SYNTHESIS};
 for(let n=0;n<stages;n++){id=edges[id];if(!id||!CAST_TYPES[id])return null}
 return CAST_TYPES[id]
}
function castResultAllowed(base,materials,p=turn){
 if(!base||!(employees[p]||[]).length)return false;
 // Replacements do not require a free slot, but may not increase an overfull staff.
 if((employees[p]||[]).length-materials.length+1>Math.max(effectiveHireLimit(p),(employees[p]||[]).length))return false;
 if(base.rarity!=='UR'||base.doppelUniqueException)return true;
 return !employees.some((staff,owner)=>(staff||[]).some(e=>!(owner===p&&materials.includes(e))&&e.rarity==='UR'&&(e.id===base.id||(base.uniquePersonGroup&&e.uniquePersonGroup===base.uniquePersonGroup)||e.name===base.name)))
}
function synthesisOptions(p=turn,kind=null,stages=1,{ignoreTurnLimit=false}={}){
 if(!ignoreTurnLimit&&fusionUsedThisTurn)return [];
 if(!Number.isSafeInteger(stages)||stages<1)return [];
 const staff=employees[p]||[],counts={};staff.forEach(e=>counts[e.id]=(counts[e.id]||0)+1);
 const need=normalFusionMaterialCount(),out=[];
 if(!kind||kind==='通常')Object.keys(CAST_SYNTHESIS).forEach(from=>{
  const b=castEvolution(from,stages,{fusion:true});if((counts[from]||0)>=need&&b)out.push({from,to:b.id,a:CAST_TYPES[from],b,materialCount:need,growthPromotion:need===1,stages,kind:'通常'})
 });
 if((!kind||kind==='モノマネ')&&!growthPromotionActive()){
  [['CN6','N'],['CR6','R'],['CSR8','SR']].forEach(([m,r])=>staff.forEach(e=>{
   const b=castEvolution(e.id,stages,{fusion:true});if(e.rarity===r&&e.id!==m&&counts[m]&&b&&!out.some(o=>o.from===e.id&&o.mimic===m))out.push({from:e.id,to:b.id,a:e,b,mimic:m,materialCount:2,stages,kind:'モノマネ'})
  }));
  const b=stages===1?CAST_TYPES.CSSR8:castEvolution('CSSR8',stages-1);
  if(counts.CSR8&&counts.CSR9&&b&&!out.some(o=>o.from==='CSR9'&&o.mimic==='CSR8'&&o.to===b.id))out.push({from:'CSR9',to:b.id,a:CAST_TYPES.CSR9,b,mimic:'CSR8',materialCount:2,stages,kind:'モノマネ'});
 }
 if(!kind||kind==='特殊')clrFusionOptions(p,stages).forEach(({rule})=>{const a=CAST_TYPES[rule.materials[0]],m=CAST_TYPES[rule.materials[1]],b=CAST_TYPES[rule.result];if(a&&m&&b)out.push({clrFusion:true,materials:[...rule.materials],to:b.id,a,m,b,materialCount:rule.materials.length,stages,kind:'特殊'})});
 return out.filter(o=>{const used=[];for(const id of o.materials||[o.from,...(o.materialCount===2?[o.mimic||o.from]:[])]){const e=staff.find(e=>e.id===id&&!used.includes(e));if(!e)return false;used.push(e)}return castResultAllowed(o.b,used,p)})
}
// The generic command owns no cost or usage ledger. Callers commit those only after validation.
function commandEvolve(mode,stages,{kind='通常',targetIndex=null,selected=null,targetFilter=()=>true,beforeCommit=()=>true,commitCost=()=>{},onSuccess=()=>{},render=true}={}){
 if(!Number.isSafeInteger(stages)||stages<1||!isViewingOwnTurn()||gameEnded)return [];
 const owner=turn,staff=employees[owner]||[],token=turnClockState.token;
 let options=mode==='レベルアップ'?staff.map((e,i)=>({from:e.id,to:castEvolution(e.id,stages)?.id,index:i})).filter(o=>o.to&&targetFilter(staff[o.index],CAST_TYPES[o.to])&&castResultAllowed(CAST_TYPES[o.to],[staff[o.index]],owner)):synthesisOptions(owner,kind,stages,{ignoreTurnLimit:true});
 if(mode==='レベルアップ'&&targetIndex!==null)options=options.filter(o=>o.index===targetIndex);
 if(selected)options=options.filter(o=>o.from===selected.from&&o.to===selected.to&&o.mimic===selected.mimic&&JSON.stringify(o.materials)===JSON.stringify(selected.materials));
 if(!options.length)return [];
 let opt=options[0];
 if(options.length>1&&targetIndex===null&&!selected){
  const n=botIsPlayer(owner)?1:Number(turnClockPrompt('雇用'+mode+'：対象を選択してください。\n'+options.map((o,i)=>(i+1)+'. '+castDisplayName(CAST_TYPES[o.from]||o.a)+' → '+castDisplayName(CAST_TYPES[o.to])).join('\n'),'1'));
  if(!Number.isInteger(n)||!options[n-1])return [];opt=options[n-1]
 }
 const used=mode==='レベルアップ'?[staff[opt.index]]:[];
 if(mode!=='レベルアップ')for(const id of opt.materials||[opt.from,...(opt.materialCount===2?[opt.mimic||opt.from]:[])]){const e=staff.find(e=>e.id===id&&!used.includes(e));if(!e)return [];used.push(e)}
 const base=CAST_TYPES[opt.to],hired=[];
 const commit=made=>{
  if(turn!==owner||turnClockState.token!==token||gameEnded||employees[owner]!==staff||used.some(e=>!staff.includes(e))||!castResultAllowed(base,used,owner)||!beforeCommit())return false;
  const index=mode==='レベルアップ'?staff.indexOf(used[0]):staff.length-used.length;
  commitCost(made);used.map(e=>staff.indexOf(e)).sort((a,b)=>b-a).forEach(i=>staff.splice(i,1));staff.splice(index,0,made);hired.push(made);
  onSuccess(made,used);if(render)renderGame();return true
 };
 if(opt.clrFusion){chooseLRAbilities({...base},commit);return hired}
 let made=applyUniqueAbilityDef({...base});if(made.doppelganger)made=resolveDoppelCopy(made);commit(made);return hired
}
function synthesizeCast(opt){
 if(!isViewingOwnTurn())return alert('相手ターン中は雇用融合できません。');
 if(fusionUsedThisTurn)return alert('雇用融合は1ターンに1回までです。');
 const o=typeof opt==='string'?{from:opt}:opt,kind=o.clrFusion?'特殊':o.mimic?'モノマネ':'通常';
 return cardCommands.koyou('融合',kind,o.stages||1,{selected:o.to?o:{...o,to:CAST_SYNTHESIS[o.from]},beforeCommit:()=>!fusionUsedThisTurn,onSuccess:made=>{
  const usage={used:fusionUsedThisTurn};cardCommands.once(1,'turn',{usage,cardId:'used',consume:true});fusionUsedThisTurn=usage.used;
  triggerNotices.push('雇用融合：'+castDisplayName(CAST_TYPES[o.from]||CAST_TYPES[o.materials?.[0]])+' → '+castDisplayName(made)+'。')
 }})
}
const ORACLE_UPGRADE_MAP=Object.freeze({
 CN1:'CR1',CR1:'CSR2',CSR2:'CSSR2',
 CN2:'CR2',CR2:'CSR3',CSR3:'CSSR3',
 CN3:'CR3',CR3:'CSR4',CSR4:'CSSR4',
 CSR1:'CSSR1',
 CN4:'CR4',CR4:'CSR5',CSR5:'CSSR5',
 CSR6:'CSSR6',
 CN5:'CR5',CR5:'CSR7',CSR7:'CSSR7',
 CN6:'CR6',CR6:'CSR8',CN7:'CR7',CR7:'CSR9',CSR9:'CSSR8',CSSR8:'CUR13'
});
function oracleUpgradeTarget(target){
 let next=ORACLE_UPGRADE_MAP[target?.id]&&castEvolution(target.id,1);
 return next?{...next}:null
}
function oracleCanUpgradeTarget(target){
 if(!target)return false;
 if(target.rarity==='SSR'&&!target.doppelganger)return false;
 return !!oracleUpgradeTarget(target)
}
function oracleSource(sourceType,sourceIndex){
 if(sourceType==='copy')return abilityProfile(copiedAbility);
 if(sourceType==='lord')return CHARACTER_DATA[charOf(turn)]||null;
 return employeeUniqueAbilitiesEnabled(turn)?(employees[turn]?.[sourceIndex]||null):null
}
function oracleAnyUsed(){return (+oracleUpgradesThisTurn[turn]||0)>0}
function oracleSourceUsed(sourceType,sourceIndex){return (+oracleUpgradesThisTurn[turn]||0)>=3}
function oracleDiscardCandidates(){return (hands[turn]||[]).map((c,i)=>({c,i})).filter(x=>!isLegendCard(x.c)&&x.c.kind!=='bread')}
function oracleCanPay(){return !oracleSourceUsed()&&oracleDiscardCandidates().length>=3&&(deck.length>0||discard.length>0)&&!pendingParkPlayers.length&&!installEffectStack.length&&!installEffectRunning}
function markOracleSourceUsed(sourceType,sourceIndex){
 cardCommands.once(3,'turn',{usage:oracleUpgradesThisTurn,cardId:turn,consume:true});
 if(sourceType==='copy')copiedOracleUsed=(+copiedOracleUsed||0)+1;
 else if(sourceType==='lord')lordOracleUsed[turn]=(+lordOracleUsed[turn]||0)+1;
 else if(employees[turn]?.[sourceIndex])employees[turn][sourceIndex].oracleUsedTurn=(+employees[turn][sourceIndex].oracleUsedTurn||0)+1;
}
function useOracleUpgrade(sourceType,sourceIndex,targetIndex,discardIndices=null){
 if(!isViewingOwnTurn()||gameEnded)return false;
 const owner=turn,source=oracleSource(sourceType,sourceIndex);if(!source?.oracleUpgrade||!oracleCanPay())return false;
 const target=employees[turn]?.[targetIndex];if(!oracleCanUpgradeTarget(target))return false;
 const upgraded=oracleUpgradeTarget(target);if(!upgraded)return false;
 const candidates=oracleDiscardCandidates(),indices=discardIndices??candidates.slice(0,3).map(x=>x.i);
 if(!Array.isArray(indices)||indices.length!==3||new Set(indices).size!==3||indices.some(i=>!Number.isInteger(i)||!candidates.some(x=>x.i===i)))return false;
 const cost=indices.map(i=>hands[owner][i]);
 const before=castDisplayName(target);
 const result=cardCommands.koyou('レベルアップ',1,{targetIndex,render:false,
  beforeCommit:()=>turn===owner&&employees[owner][targetIndex]===target&&cost.every(c=>hands[owner].includes(c))&&oracleCanPay(),
  commitCost:ne=>{markOracleSourceUsed(sourceType,sourceIndex);if(sourceType==='employee'&&sourceIndex===targetIndex)ne.oracleUsedTurn=target.oracleUsedTurn;cardCommands.move(cost,{zone:'hand',owner},{zone:'discard'})}
 });
 if(!result.length)return false;
 const ne=result[0],placed=cardCommands.toba({owner});
 triggerNotices.push('《神託》：'+before+' → '+castDisplayName(ne)+'（'+ne.rarity+'）。通常手札3枚を捨て、'+(placed?'山札から「'+placed.name+'」を仮設置しました。':'山札から設置できませんでした。'));renderGame();return true;
}
function tributeSource(sourceType,sourceIndex){
 if(sourceType==='copy')return abilityProfile(copiedAbility);
 if(sourceType==='lord')return CHARACTER_DATA[charOf(turn)]||null;
 return employeeUniqueAbilitiesEnabled(turn)?(employees[turn]?.[sourceIndex]||null):null
}
function tributeSourceUsed(sourceType,sourceIndex){
 const usage=sourceType==='copy'?{uses:copiedTributeUsed}:sourceType==='lord'?lordTributeUsed:employees[turn]?.[sourceIndex];return !usage||!cardCommands.once(1,'turn',{usage,cardId:sourceType==='lord'?turn:sourceType==='copy'?'uses':'tributeUsedTurn'})
}
function markTributeSourceUsed(sourceType,sourceIndex){
 if(sourceType==='copy'){let usage={uses:copiedTributeUsed};cardCommands.once(1,'turn',{usage,cardId:'uses',consume:true});copiedTributeUsed=usage.uses}else if(sourceType==='lord')cardCommands.once(1,'turn',{usage:lordTributeUsed,cardId:turn,consume:true});else if(employees[turn]?.[sourceIndex])cardCommands.once(1,'turn',{usage:employees[turn][sourceIndex],cardId:'tributeUsedTurn',consume:true})
}
function useTributeInstall(sourceType,sourceIndex,handIndex){
 let source=tributeSource(sourceType,sourceIndex);if(!source?.tributeInstall)return;
 if(tributeSourceUsed(sourceType,sourceIndex))return alert('この個体の《貢ぎ物》はこのターン使用済みです。');
 let i=Number(handIndex);if(!Number.isInteger(i)||i<0||!hands[turn]?.[i])return alert('設置する通常手札を選んでください。');
 let c=hands[turn][i];cardCommands.toba({card:c,from:'hand'});let b=cardCommands.draw('command',1).cards[0];markTributeSourceUsed(sourceType,sourceIndex);
 if(b)triggerNotices.push('《貢ぎ物》：命令書「'+breadLabel(b)+'」を1枚獲得しました。');renderGame()
}
// @kokoryo-end-section S0073

// @kokoryo-section S0075

function dismissEmployee(index){
 if(!isViewingOwnTurn())return alert('相手ターン中は解雇できません。');
 let staff=employees[turn]||[];
 if(staff.length<effectiveHireLimit())return alert('解雇は雇用枠が上限のときだけ使用できます。');
 let target=staff[index];if(!target)return;
 if(!turnClockConfirm('「'+castDisplayName(target)+'」を解雇しますか？'))return;
 staff.splice(index,1);
 triggerNotices.push('P'+(turn+1)+'が「'+castDisplayName(target)+'」を解雇しました。');
 renderGame();
}
// @kokoryo-end-section S0075

// @kokoryo-section S0079

function gainLordResource(color){if(pendingLordResource<=0||!eraGainAllowed(turn,color,'effect'))return;cardCommands.pool(color,1);playLogAction('character_ability',{ability:'lord_resource',color,gained:1});pendingLordResource--;renderGame()}
// @kokoryo-end-section S0079

// @kokoryo-section S0092

function organizationUpgradeRarity(r){return ({N:'R',R:'SR',SR:'SSR',SSR:'UR'})[r]||null}
function organizationPool(rarity){
 let packIds=[];Object.values(KOKORYO_PACKS).forEach(pack=>{if(isPackEnabled(pack.id))packIds.push(...(pack.castIds||Object.keys(pack.casts||{})))});
 let ids=[...new Set([...IMPLEMENTED_CAST_IDS,...packIds])];
 return ids.map(id=>CAST_TYPES[id]).filter(e=>e&&e.rarity===rarity&&!e.synthesisOnly&&(rarity!=='UR'||!isUniqueRareAlreadyHired(e.id)));
}
// @kokoryo-end-section S0092

// @kokoryo-section S0095

function upgradeRarity(r){return ({N:'R',R:'SR',SR:'SSR',SSR:'UR'})[r]||null}
function packCastPool(rarity){let packIds=[];Object.values(KOKORYO_PACKS).forEach(pack=>{if(isPackEnabled(pack.id))packIds.push(...(pack.castIds||Object.keys(pack.casts||{})))});let ids=[...new Set([...IMPLEMENTED_CAST_IDS,...packIds])];return ids.map(id=>CAST_TYPES[id]).filter(e=>e&&e.rarity===rarity&&!e.synthesisOnly&&(rarity!=='UR'||!isUniqueRareAlreadyHired(e.id)))}
function oneStepUpgradeCast(target,{allowUR=true}={}){
 if(!target)return null;
 let nr=upgradeRarity(target.rarity);if(!nr||(!allowUR&&nr==='UR'))return null;
 let mappedId=CAST_SYNTHESIS[target.id],mapped=mappedId&&CAST_TYPES[mappedId];
 if(mapped&&mapped.rarity===nr)return {...mapped};
 let pool=packCastPool(nr);
 return pool.length?{...pool[Math.floor(Math.random()*pool.length)]}:null
}
function organizationMaterialGroups(){let staff=employees[turn]||[],by={};staff.forEach((e,i)=>{if(e.rarity!=='UR')(by[e.rarity]||(by[e.rarity]=[])).push({e,i})});return by}
function usePromoteCastPair(card,spec,rarity,firstIndex,secondIndex){
 if(!isViewingOwnTurn())return alert('相手ターン中は使用できません。');if(organizationUsed.includes(card.id))return alert('このカードはこのターン使用済みです。');let cost=spec.cost||{},p=powers[turn];if(!canPayResourceCost({["y"]:(cost.y||0),["p"]:(cost.p||0),["r"]:(cost.r||0)},turn))return alert('起動に必要な資源が足りません。');let by=organizationMaterialGroups(),cand=by[rarity]||[];let a=cand.find(x=>x.i===+firstIndex),b=cand.find(x=>x.i===+secondIndex);if(!a||!b||a.i===b.i)return alert('同じレアリティの異なる2人を選んでください。');let nextR=upgradeRarity(rarity),pool=packCastPool(nextR);if(!nextR||!pool.length)return alert('1段階上の排出候補がありません。');payResourceCost({["y"]:(cost.y||0),["p"]:(cost.p||0),["r"]:(cost.r||0)},turn);let staff=employees[turn]||[];[a.i,b.i].sort((x,y)=>y-x).forEach(i=>staff.splice(i,1));let e=pool[Math.floor(Math.random()*pool.length)];staff.push({...e});organizationUsed.push(card.id);triggerNotices.push('《'+card.name+'》：'+rarity+'2人を再編し、'+nextR+'「'+castDisplayName(e)+'」を雇用しました。');renderGame()
}
// @kokoryo-end-section S0095

// @kokoryo-section S0097


function useDoubleHire(cardIndex){
 if(!isViewingOwnTurn())return;
 let c=installed[turn]?.[cardIndex];if(!c||c.special!=='doubleHire')return;
 if(hiredThisTurn)return alert('雇用は1ターンに1回までです。');
 if((employees[turn]||[]).length+2>effectiveHireLimit())return alert('W雇用には雇用枠が2人分必要です。');
 // 通常雇用1回分だけ支払い、2人目は同じ雇用の追加分として確定する。
 if(!hireEmployee(unusedDice()[0]?.id))return;
 let i=installed[turn].indexOf(c);if(i>=0)discard.push(installed[turn].splice(i,1)[0]);
 let e=gachaCast();if(e)finalizeHire(e);
 renderGame();
}
// @kokoryo-end-section S0097

// @kokoryo-section S0104

function useSora(handIndex){if(charOf(turn)!=='sora')return;let c=hands[turn][handIndex];if(!c)return alert('捨てるマーケットカードを選んでください。');if(!breadDeck.length&&!breadDiscard.length)return alert('命令書の山札・捨て札がないため獲得できません。');discard.push(hands[turn].splice(handIndex,1)[0]);let got=drawBread(turn);if(got)triggerNotices.push('ソラ：手札の「'+c.name+'」を捨て、命令書「'+breadLabel(got)+'」を1枚獲得しました。');renderGame()}
function useFran(fieldIndex,handIndex){if(charOf(turn)!=='fran')return;let old=installed[turn][fieldIndex],c=hands[turn][handIndex];if(!old||!c||old.vp===null||c.vp===null)return alert('対象カードを選んでください。');let v=fixedVP(old),nv=fixedVP(c);if(nv!==v&&nv!==v+1)return alert('同じVPまたは+1VPのカードを選んでください。');discard.push(installed[turn].splice(fieldIndex,1)[0]);registerInstallation(turn,hands[turn].splice(handIndex,1)[0]);renderGame()}
// @kokoryo-end-section S0104

// @kokoryo-section S0106

function invisibleHandCount(p=turn){let lord=CHARACTER_DATA[charOf(p)]||{};return (lord.invisibleHand||0)+(employeeUniqueAbilitiesEnabled(p)?(employees[p]||[]):[]).reduce((n,e)=>n+(e.invisibleHand||0),0)+(p===turn&&copiedAbility==='神の見えざる手'?(abilityProfile(copiedAbility).invisibleHand||0):0)}
function useInvisibleHand(handIndex,color){let n=invisibleHandCount();if(n<=0)return;let c=hands[turn][+handIndex];if(!c)return alert('捨てる手札を選んでください。');c=cardCommands.choice('hand',1,{select:[c]})[0];cardCommands.move(c,'hand','discard');cardCommands.pool(color,n);triggerNotices.push('《神の見えざる手》：「'+c.name+'」を捨て、'+cname(color)+'を'+n+'個獲得しました。');renderGame()}
// @kokoryo-end-section S0106
