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
 '等価交換':{stackable:false,text:'ターン開始時に資金5を獲得する。資源コストは種類を問わず合計量で支払い、資源を参照する可変VPは全体で最適化する。資金・食料・兵力の獲得不可を無視する。',props:{equivalentExchange:true}},
 '神算鬼謀':{text:'ターン開始時、命令書を2枚獲得する。この個体での初回発動時は、さらに4枚獲得する。',props:{turnBread:2,firstBreadBonus:4}},
 'おねだり':{text:'通常カードを設置するとき、必要なサイコロのうち好きな1つを使わずに設置できる。',props:{installDiceDiscount:1}},
 'オーバークロック':{copyable:false,stackable:true,text:'この個体での初回のみ、ターン開始時に好きな資源を合計20個、任意に配分して獲得する。',props:{overclockResources:20}},
 '神の見えざる手':{text:'ターン開始時、通常カードを2枚引く。通常手札を1枚捨て、好きな資源を2個獲得できる。',props:{invisibleHand:2}},
 'リクリエイション':{copyable:true,stackable:false,text:'自分の設置済み通常カード1枚を、VP差±2以内の通常手札1枚と入れ替えて仮設置する。設置時効果は発動する。レジェンドカードは対象外。',props:{recreationRange:2}},
 '無限の黄金':{copyable:false,stackable:false,text:'領主マイン・雇用ゴルドは10VPを持つ。雇用キャラクターの固有能力は無効化しない。この能力はコピーできない。',props:{copyable:false,uncopyable:true,vpOverride:10}},
 '神の恩恵':{text:'ターン開始時、サイコロを2個追加で獲得する。サイコロを好きな種類の資源に変換でき、サイコロ変換の獲得量を＋2する（基本3個から合計5個、命令書は対象外）。',props:{extraDice:2,dieResourceBonus:2,anyResourceDieConversionAmount:5}},
 '神託':{text:'各個体につき1ターン2回、通常雇用の代わりにサイコロ1個と資金5を支払い、雇用1人を既定の1段階上へレベルアップする。',props:{oracleUpgrade:true,oracleUses:2}},
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
function registerCLRFusionRule(materials,result){CLR_FUSION_RULES.push({materials:[...materials],result})}
function clrFusionOptions(p=turn){let st=employees[p]||[];return CLR_FUSION_RULES.filter(r=>r.materials.every(id=>st.some(e=>e.id===id))).map(r=>({rule:r}))}
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

function handCardLikelyInstallable(c){if(balancedInstallCost(c)){const choices=balancedCostChoices(c);const base={greatermine:'mine',greaterfarm:'farm',greaterbarracks:'barracks',greatercommand:'commandroom'}[c.special];return !!(choices&&balancedCostValid(c,choices)||base&&installed[turn].some(x=>x.special===base)&&balancedCostValid(c,[],{upgrade:true}))}let p=powers[turn],opts=n=>installCostOptions(n).length,any=()=>installCostOptions(null).length;if(c.installSpec?.any)return any()>=c.installSpec.any;if(c.type==='S'){let need={plan:[0,2,0,0],adjust:[0,4,0,0],restrict:[0,3,0,0],permit:[0,3,0,0],mine:[2,0,0,1],farm:[0,0,2,3],barracks:[0,2,0,5],commandroom:[3,1,0,3],warehouse:[0,0,0,1],church:[3,0,1,1]}[c.special];if(!need)return true;if(p.y<need[0]||p.r<need[1]||p.p<need[2])return false;let faces={mine:[1,2],farm:[3,4],barracks:[5,6],commandroom:[3,4],warehouse:[1,3,5],church:[1,4]}[c.special];return !faces||faces.some(v=>opts(v)>0)}if(c.special==='laws')return p.y>=5;if(c.special==='scout')return p.y>=2&&p.r>=2&&p.p>=2&&(employees[turn]||[]).length<gameSettings.hireLimit;if(c.special==='famine')return p.p>=3&&opts(3)>=3;if(c.special==='swordhunt')return p.r>=4&&opts(6)>0;if(c.special==='graveyard')return p.p>=1&&p.r>=2&&(opts(4)+opts(5)>0);if(c.special==='landgrab')return p.y>=2&&p.r>=2&&p.p>=2&&opts(2)>0&&opts(5)>0;if(c.special==='bandit')return p.y>=4&&p.p>=3&&any()>=3;if(c.special==='publicmarket')return p.y>=1&&p.r>=1&&p.p>=1&&any()>0;if(c.special==='lordmeeting')return p.y>=4&&(opts(1)+opts(6)>0);if(c.special==='blackcasino')return p.p>=5&&opts(2)>0&&opts(5)>0;if(c.special==='cursedclock')return p.p>=3&&(opts(5)+opts(6)>0);if(c.special==='ninjaguild')return p.y>=5&&(opts(1)+opts(2)>0);if(c.special==='paneteria')return any()>0;if(c.special==='elekiter')return p.y>=1&&p.r>=1&&p.p>=1&&opts(2)>0&&opts(5)>0;if(c.special==='nanban')return p.y>=2&&p.r>=2&&p.p>=2&&any()>=2;if(c.special==='tenkucat')return p.y>=2&&p.r>=1&&p.p>=2&&opts(1)>0&&opts(6)>0&&installed[turn].length>0;if(c.special==='treasureship')return Math.max(p.y,p.r,p.p)>=30;if(c.special==='inadamashii')return installed[turn].length>=8;return true}
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
function resolveDoppelCopy(e){if(!e?.doppelganger)return e;let targets=[];for(let p=0;p<playerCount;p++)(employees[p]||[]).forEach((x,i)=>{if(x&&x.rarity===e.rarity&&!x.doppelganger)targets.push({p,i,x})});if(!targets.length){e.copiedFrom=null;return e}let msg=targets.map((t,i)=>(i+1)+'. P'+(t.p+1)+' '+castDisplayName(t.x)).join('\n');let n=Math.floor(+(turnClockPrompt('《ドッペルゲンガー》\nコピーする同レアリティの雇用キャラクターを選んでください。\n\n'+msg,'1')||0));if(!n||!targets[n-1]){e.copiedFrom=null;return e}let src=targets[n-1].x;let copied={...e,copiedFrom:src.id,uniqueAbility:src.uniqueAbility,abilityText:castEffectText(src),copySourceName:castDisplayName(src)};return applyUniqueAbilityDef(copied) }
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
  if(powers[turn].y<5)return alert('雇用には資金5が必要です。');
  let d=useDie(dieId);if(!d)return alert('未使用のサイコロを1個選んでください。');
  powers[turn].y-=5;
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
function synthesisOptions(p=turn){
 if(fusionUsedThisTurn)return [];
 let staff=employees[p]||[],counts={};staff.forEach(e=>counts[e.id]=(counts[e.id]||0)+1);
 let need=normalFusionMaterialCount();
 let out=Object.entries(CAST_SYNTHESIS)
  .filter(([from])=>(counts[from]||0)>=need)
  .map(([from,to])=>({from,to,a:CAST_TYPES[from],b:CAST_TYPES[to],materialCount:need,growthPromotion:need===1}));
 // モノマネ師を使う2素材融合は通常ルール時のみ候補に出す。
 if(!growthPromotionActive()){
  [['CN6','N'],['CR6','R'],['CSR8','SR']].forEach(([m,r])=>{staff.forEach((e,i)=>{if(e.rarity===r&&e.id!==m&&(counts[m]||0)>0&&CAST_SYNTHESIS[e.id])out.push({from:e.id,to:CAST_SYNTHESIS[e.id],a:e,b:CAST_TYPES[CAST_SYNTHESIS[e.id]],mimic:m,materialCount:2})})});
  if((counts.CSR8||0)&&(counts.CSR9||0))out.push({from:'CSR9',to:'CSSR8',a:CAST_TYPES.CSR9,b:CAST_TYPES.CSSR8,mimic:'CSR8',materialCount:2});
 }
 // LR融合は《成長促進》の対象外。必要素材は従来どおり。
 clrFusionOptions(p).forEach(({rule})=>{let a=CAST_TYPES[rule.materials[0]],m=CAST_TYPES[rule.materials[1]],b=CAST_TYPES[rule.result];if(a&&m&&b)out.push({clrFusion:true,materials:[...rule.materials],to:rule.result,a,m,b,materialCount:rule.materials.length})});
 return out
}
function synthesizeCast(opt){
 if(!isViewingOwnTurn())return alert('相手ターン中は雇用融合できません。');
 if(fusionUsedThisTurn)return alert('雇用融合は1ターンに1回までです。');
 let o=typeof opt==='string'?{from:opt}:opt,staff=employees[turn]||[];
 if(o.clrFusion){
  let used=[];
  for(const id of o.materials||[]){let i=staff.findIndex((e,idx)=>e.id===id&&!used.includes(idx));if(i<0)return alert('LR融合に必要な雇用キャラクターが足りません。');used.push(i)}
  let base={...CAST_TYPES[o.to]};
  chooseLRAbilities(base,made=>{
   if(fusionUsedThisTurn)return alert('このターンはすでに雇用融合済みです。');
   let check=[];
   for(const id of o.materials||[]){let i=staff.findIndex((e,idx)=>e.id===id&&!check.includes(idx));if(i<0)return alert('LR融合に必要な雇用キャラクターが足りなくなりました。');check.push(i)}
   check.sort((a,b)=>b-a).forEach(i=>staff.splice(i,1));
   staff.push(made);fusionUsedThisTurn=true;
   triggerNotices.push('LR融合：'+o.materials.map(id=>castDisplayName(CAST_TYPES[id])).join('＋')+' → '+castDisplayName(made)+'。取得能力：'+(made.grantedAbilities||[]).map(x=>'《'+x+'》').join('＋'));
   renderGame()
  });
  return
 }
 let to=o.to||CAST_SYNTHESIS[o.from];
 if(!to)return alert('融合先がありません。');
 let used=[];
 let first=staff.findIndex(e=>e.id===o.from);
 if(first<0)return alert('融合に必要な雇用キャラクターが足りません。');
 used.push(first);
 if(!growthPromotionActive()){
  let second=o.mimic
   ? staff.findIndex((e,i)=>e.id===o.mimic&&!used.includes(i))
   : staff.findIndex((e,i)=>e.id===o.from&&!used.includes(i));
  if(second<0)return alert('融合に必要な雇用キャラクターが足りません。');
  used.push(second);
 }
 used.sort((a,b)=>b-a).forEach(i=>staff.splice(i,1));
 let made=applyUniqueAbilityDef({...CAST_TYPES[to]});if(made.doppelganger)made=resolveDoppelCopy(made);staff.push(made);
 fusionUsedThisTurn=true;
 triggerNotices.push('雇用融合：'+CAST_TYPES[o.from].name+(growthPromotionActive()?'×1（《成長促進》）':(o.mimic?'＋モノマネ師':'×2'))+' → '+CAST_TYPES[to].name+'。');
 renderGame()
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
 let id=ORACLE_UPGRADE_MAP[target?.id],next=id&&CAST_TYPES[id];
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
function oracleAnyUsed(){return (+copiedOracleUsed||0)>0||(+lordOracleUsed[turn]||0)>0||(employees[turn]||[]).some(e=>(+e.oracleUsedTurn||0)>0)}
function oracleSourceUsed(sourceType,sourceIndex){const n=sourceType==='copy'?copiedOracleUsed:sourceType==='lord'?lordOracleUsed[turn]:employees[turn]?.[sourceIndex]?.oracleUsedTurn;return (+n||0)>=2}
function markOracleSourceUsed(sourceType,sourceIndex){
 if(sourceType==='copy'){const ledger={uses:+copiedOracleUsed||0};cardCommands.once(2,'turn',{usage:ledger,cardId:'uses',consume:true});copiedOracleUsed=ledger.uses}
 else if(sourceType==='lord')cardCommands.once(2,'turn',{usage:lordOracleUsed,cardId:turn,consume:true});
 else if(employees[turn]?.[sourceIndex])cardCommands.once(2,'turn',{usage:employees[turn][sourceIndex],cardId:'oracleUsedTurn',consume:true})
}
function useOracleUpgrade(sourceType,sourceIndex,targetIndex){
 let source=oracleSource(sourceType,sourceIndex);if(!source?.oracleUpgrade)return;
 if(hiredThisTurn&&!oracleAnyUsed())return alert('《神託》は通常の雇用の代わりに使用するため、このターンはすでに雇用済みです。');
 if(oracleSourceUsed(sourceType,sourceIndex))return alert('この個体の《神託》はこのターン使用済みです。');
 let target=employees[turn]?.[targetIndex];if(!target)return alert('レベルアップする雇用キャラクターを選んでください。');
 if(!oracleCanUpgradeTarget(target))return alert('SSRはドッペルゲンガー以外、《神託》の対象にできません。');
 let upgraded=oracleUpgradeTarget(target);if(!upgraded)return alert('このキャラクターには《神託》のレベルアップ先が設定されていません。');
 let nr=upgraded.rarity;
 if(powers[turn].y<5)return alert('《神託》には資金5が必要です。');
 let d=unusedDice()[0];if(!d)return alert('《神託》には未使用のサイコロ1個が必要です。');
 let usedDie=useDie(d.id);if(!usedDie)return alert('《神託》に使用するサイコロを消費できませんでした。');
 powers[turn].y-=5;
 let ne=applyUniqueAbilityDef(upgraded);if(ne.doppelganger)ne=resolveDoppelCopy(ne);
 let before=castDisplayName(target);markOracleSourceUsed(sourceType,sourceIndex);if(sourceType!=='lord'&&sourceType!=='copy'&&sourceIndex===targetIndex)ne.oracleUsedTurn=target.oracleUsedTurn;cardCommands.koyou('select',1,{pool:[ne],selected:[ne],canHire:()=>true,accept:next=>{cardCommands.move(target,{zone:'employees',owner:turn},[]);cardCommands.move(next,[next],{zone:'employees',owner:turn},{index:targetIndex})}});hiredThisTurn=true;
 triggerNotices.push('《神託》：'+before+' → '+castDisplayName(ne)+'（'+nr+'）へレベルアップしました。');renderGame()
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
 if(!isViewingOwnTurn())return alert('相手ターン中は使用できません。');if(organizationUsed.includes(card.id))return alert('このカードはこのターン使用済みです。');let cost=spec.cost||{},p=powers[turn];if(p.y<(cost.y||0)||p.p<(cost.p||0)||p.r<(cost.r||0))return alert('起動に必要な資源が足りません。');let by=organizationMaterialGroups(),cand=by[rarity]||[];let a=cand.find(x=>x.i===+firstIndex),b=cand.find(x=>x.i===+secondIndex);if(!a||!b||a.i===b.i)return alert('同じレアリティの異なる2人を選んでください。');let nextR=upgradeRarity(rarity),pool=packCastPool(nextR);if(!nextR||!pool.length)return alert('1段階上の排出候補がありません。');p.y-=cost.y||0;p.p-=cost.p||0;p.r-=cost.r||0;let staff=employees[turn]||[];[a.i,b.i].sort((x,y)=>y-x).forEach(i=>staff.splice(i,1));let e=pool[Math.floor(Math.random()*pool.length)];staff.push({...e});organizationUsed.push(card.id);triggerNotices.push('《'+card.name+'》：'+rarity+'2人を再編し、'+nextR+'「'+castDisplayName(e)+'」を雇用しました。');renderGame()
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
