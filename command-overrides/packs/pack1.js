(()=>{
window.KOKORYO_PACKS=window.KOKORYO_PACKS||{};
const commandOnHire='雇用時：命令書1枚を獲得。';
function pay(api,p,cost){return api.payResources(p,cost)}
function clearAllDebt(api){for(let p=0;p<api.playerCount;p++)api.clearDebt(p)}
window.KOKORYO_PACKS.pack1={
 id:'pack1',name:'追加パック1',
 castSynthesis:{CN4:'CR4',CR4:'CSR5',CSR5:'CSSR5',CN5:'CR5',CR5:'CSR7',CSR7:'CSSR7'},
 characters:{
  P13:{name:'ジュネ',title:'天使見習い',gender:'男性',group:'june',selectLabel:'ジュネ',uniqueAbility:'リクリエイション'},
  P14:{name:'ジュネ',title:'天使見習い',gender:'女性',group:'june',selectLabel:'ジュネ',uniqueAbility:'リクリエイション'},
  P15:{name:'マイン',title:'無限の黄金',gender:'男性',group:'minegold',selectLabel:'マイン',uniqueAbility:'無限の黄金'},
  P16:{name:'マイン',title:'無限の黄金',gender:'女性',group:'minegold',selectLabel:'マイン',uniqueAbility:'無限の黄金'},
  P17:{name:'築友城 トキ',title:'駆け出し領主',gender:'男性',group:'hero',selectLabel:'トキ／さくら',uniqueAbility:'神の恩恵'},
  P18:{name:'築友城 さくら',title:'駆け出し領主',gender:'女性',group:'hero',selectLabel:'トキ／さくら',uniqueAbility:'神の恩恵'}
 },
 characterFamilies:[
  {id:'june',label:'ジュネ',packId:'pack1',versions:[{id:'apprenticeAngel',label:'天使見習い',male:'P13',female:'P14'}]},
  {id:'minegold',label:'マイン',packId:'pack1',versions:[{id:'infiniteGold',label:'無限の黄金',male:'P15',female:'P16'}]},
  {id:'hero',label:'トキ／さくら',packId:'pack1',versions:[{id:'beginnerLord',label:'駆け出し領主',male:'P17',female:'P18'}]}
 ],
 casts:{
  CN4:{id:'CN4',name:'見習い賭博師',rarity:'N',hireBread:1,abilityText:'雇用した時、命令書を1枚獲得する。'},
  CR4:{id:'CR4',name:'ディーラー',rarity:'R',noCommonDie:true,extraChosenDice:1,hireBread:1,abilityText:'雇用した時、命令書を1枚獲得する。ターン開始時、好きな出目のサイコロを1つ獲得する。'},
  CSR5:{id:'CSR5',name:'イカサマ師',rarity:'SR',synthesisOnly:true,extraChosenDice:1,hireBread:1,abilityText:'雇用した時、命令書を1枚獲得する。ターン開始時、ランダムなサイコロを1つと好きな出目のサイコロを1つ獲得する。'},
  CSSR5:{id:'CSSR5',name:'伝説の勝負師',rarity:'SSR',synthesisOnly:true,extraChosenDice:1,hireBread:1,abilityText:'雇用した時、命令書を1枚獲得する。ターン開始時、好きな出目のサイコロを2つ獲得する。'},
  CSR6:{id:'CSR6',name:'メイド',rarity:'SR',chooseResource:true,amount:3,turnBread:1,noCommonDie:true,abilityText:'ターン開始時、命令書を1枚と好きな1種類の資源を3個獲得する。このキャラはターン開始時にサイコロを獲得しない。'},
  CSSR6:{id:'CSSR6',name:'メイド長',rarity:'SSR',flexibleResourceTotal:3,turnBread:1,noCommonDie:true,abilityText:'ターン開始時、命令書を1枚と好きな資源を合計3個獲得する。このキャラはターン開始時にサイコロを獲得しない。'},
  CN5:{id:'CN5',name:'プロレタリア',rarity:'N',noCommonDie:true,financeIncome:{self:2,others:0,debt:0},abilityText:'ターン開始時、資金2を獲得する。このキャラはターン開始時にサイコロを獲得しない。'},
  CR5:{id:'CR5',name:'ブルジョワ',rarity:'R',financeIncome:{self:3,others:1,debt:0},abilityText:'ターン開始時、自分は資金3を獲得する。自分以外の全プレイヤーは資金1を獲得する。'},
  CSR7:{id:'CSR7',name:'プレジデント',rarity:'SR',synthesisOnly:true,financeIncome:{self:3,others:2,debt:1},abilityText:'ターン開始時、自分は資金3を獲得する。自分以外の全プレイヤーは資金2と負債1枚を獲得する。'},
  CSSR7:{id:'CSSR7',name:'タイクーン',rarity:'SSR',synthesisOnly:true,financeIncome:{self:4,others:2,debt:1},abilityText:'ターン開始時、自分は資金4を獲得する。自分以外の全プレイヤーは資金2と負債1枚を獲得する。'},
  CUR7:{id:'CUR7',name:'リラ',title:'創造の大魔術師',rarity:'UR',uniqueAbility:'リクリエイション',chooseDie:true,personKey:'lira'},
  CUR8:{id:'CUR8',name:'ゴルド',title:'金・暴力・欲望',rarity:'UR',uniqueAbility:'無限の黄金',chooseDie:true,personKey:'gold'},
  CUR9:{id:'CUR9',name:'榎 奏音',title:'もう1人の転移者',rarity:'UR',uniqueAbility:'神の恩恵',chooseDie:true,personKey:'kanon'}
 },
 castIds:['CN4','CR4','CSR5','CSSR5','CSR6','CSSR6','CN5','CR5','CSR7','CSSR7','CUR7','CUR8','CUR9'],
 normalCards:[
  {key:'N16',name:'緊急補充人員',type:'N',vp:1,implemented:true,costText:'🎲ANY×2',effectText:'1ターンに1回、負債を2枚獲得することで、好きなNの雇用キャラクター1人をコストなしで雇用する。',installSpec:{any:2},hooks:{turnStart:({card})=>{card._usedThisTurn=false}},fieldAction:{render:({parent,card,api})=>{
   const row=document.createElement('div');row.className='actionblock';row.style.margin='5px';const pool=api.cardPool('N');const sel=document.createElement('select');pool.forEach(e=>{const o=document.createElement('option');o.value=e.id;o.textContent=e.name;sel.appendChild(o)});const b=document.createElement('button');b.className='secondary';b.textContent='負債2枚でNを指定雇用';b.disabled=!!card._usedThisTurn||!pool.length||!api.canHire()||api.debtSupply()<2;b.onclick=()=>{if(card._usedThisTurn||!api.canHire()||api.debtSupply()<2)return;const e=pool.find(x=>x.id===sel.value);if(!e)return;if(api.addDebt(api.owner,2)!==2)return;card._usedThisTurn=true;api.hireNamedN(e.id);api.redraw()};row.append(sel,b);parent.appendChild(row)
  }}},
  {key:'N17',name:'借り入れ',type:'N',vp:1,implemented:true,costText:'🎲5/6＋食料3',effectText:'1ターンに1回、負債を1枚獲得することで、資金を2つ獲得する。',installSpec:{faces:[[5,6]],resources:{p:3}},hooks:{turnStart:({card})=>{card._usedThisTurn=false}},fieldAction:{render:({parent,card,api})=>{
   const b=document.createElement('button');b.className='secondary';b.textContent='負債1枚を獲得 → 資金2';b.disabled=!!card._usedThisTurn||api.debtSupply()<1;b.onclick=()=>{if(card._usedThisTurn||api.debtSupply()<1)return;if(api.addDebt(api.owner,1)!==1)return;card._usedThisTurn=true;api.resource(api.owner,'y',2);api.redraw()};parent.appendChild(b)
  }}},
  {key:'N18',name:'バブル崩壊',type:'N',vp:2,implemented:true,costText:'🎲1＋🎲4＋資金3＋食料3',effectText:'設置時、自分は負債を2枚獲得し、ほかのプレイヤーは負債を1枚獲得する。',installSpec:{faces:[[1],[4]],resources:{y:3,p:3}},hooks:{onInstall:({owner,api})=>{api.addDebt(owner,2);api.distributeDebt('others',1)}}},
  {key:'N19',name:'債務不履行',type:'N',vp:2,implemented:true,costText:'🎲ANY×(5−自分の負債枚数、最低0)',effectText:'設置時、全員の負債をすべて捨てる。各プレイヤーは、自分が捨てた負債1枚につき、資金・食料・兵力をそれぞれ1つずつ捨てる。ただし最終ターンは資源を捨てない。',installSpec:{any:({owner,api})=>Math.max(0,5-api.debt(owner))},hooks:{onInstall:({api})=>{for(let p=0;p<api.playerCount;p++){const n=api.clearDebt(p);if(api.isFinalTurn())continue;for(const k of ['y','p','r'])api.resource(p,k,-Math.min(n,api.powers[p][k]||0))}}}},
  {key:'N20',name:'連帯保証',type:'N',vp:-2,implemented:true,costText:'🎲ANY',effectText:'設置時、自分の負債を2枚まで捨てる。ほかのプレイヤー全員は、捨てた枚数と同じ枚数の負債を獲得する。',installSpec:{any:1},hooks:{onInstall:({owner,api})=>{const n=api.removeDebt(owner,2);if(n)api.distributeDebt('others',n)}}},
  {key:'N21',name:'自転車操業',type:'N',vp:1,implemented:true,costText:'🎲2＋🎲5＋資金5',effectText:'サイコロ1個と負債1枚を捨てることで、資金を3つ獲得する。',installSpec:{faces:[[2],[5]],resources:{y:5}},fieldAction:{render:({parent,api})=>{
   const row=document.createElement('div');row.className='actionblock';row.style.margin='5px';const sel=document.createElement('select');api.dice.filter(d=>!d.used).forEach(d=>{const o=document.createElement('option');o.value=d.id;o.textContent='🎲'+d.value+' (#'+d.id+')';sel.appendChild(o)});const b=document.createElement('button');b.className='secondary';b.textContent='🎲1個＋負債1枚 → 資金3';b.disabled=!sel.options.length||api.debt(api.owner)<1;b.onclick=()=>{if(api.debt(api.owner)<1||!api.useDie(sel.value))return;if(!api.removeDebt(api.owner,1))return;api.resource(api.owner,'y',3);api.redraw()};row.append(sel,b);parent.appendChild(row)
  }}},
  {key:'N22',name:'夜逃げ',type:'N',vp:0,implemented:true,costText:'ターン開始時の資源獲得後／負債5枚以上／コストなし',effectText:'ターン開始時の資源獲得後、手札にあり、負債を5枚以上持っている場合、コストなしで設置できる。設置時、すべての負債・資源・命令書を捨て、未使用のサイコロをすべて使用済みにする。その後、好きな資源を合計4つ獲得する。次の自分のターン開始時、領主および雇用キャラクターが持つ「ゲーム中に1回だけ発動する効果」を再び発動させる。'},
  {key:'N23',name:'徳政令',type:'N',vp:3,implemented:true,costText:'🎲1＋🎲3＋🎲6',effectText:'設置時、全員の負債をすべて捨てる。',installSpec:{faces:[[1],[3],[6]]},hooks:{onInstall:({api})=>clearAllDebt(api)}},
  {key:'N24',name:'債務回収',type:'N',vp:1,implemented:true,costText:'🎲5/6＋兵力4',effectText:'1ターンに1回、兵力1を支払うことで、資金2または食料2を獲得する。',installSpec:{faces:[[5,6]],resources:{r:4}},hooks:{turnStart:({card})=>{card._usedThisTurn=false}},fieldAction:{render:({parent,card,api})=>{
   const row=document.createElement('div');row.className='actionblock';row.style.margin='5px';for(const [k,name] of [['y','資金'],['p','食料']]){const b=document.createElement('button');b.className='secondary';b.textContent='兵力1 → '+name+'2';b.disabled=!!card._usedThisTurn||!api.canPayResources(api.owner,{r:1});b.onclick=()=>{if(card._usedThisTurn||!api.canPayResources(api.owner,{r:1}))return;if(!api.payResources(api.owner,{r:1}))return;api.resource(api.owner,k,2);card._usedThisTurn=true;api.redraw()};row.appendChild(b)}parent.appendChild(row)
  }}},
  {key:'N25',name:'カルテル',type:'N',vp:1,implemented:true,costText:'🎲ANY＋資金3',effectText:'設置時：自分は資金3・食料3・兵力3。他プレイヤーは各1。',installSpec:{any:1,resources:{y:3}},hooks:{onInstall:({owner,api})=>{for(let p=0;p<api.playerCount;p++)for(const k of ['y','p','r'])api.resource(p,k,p===owner?3:1)}}}
 ],
 legends:[
  {id:'LL7',tier:'lower',name:'マネーロンダリング',vp:1,special:'moneyLaundering',cost:{y:20},costText:'資金20',effectText:'設置時、食料10・兵力10を獲得する。1ターンに1回、資金5を支払うことで、食料10または兵力10を獲得する。'},
  {id:'LL8',tier:'lower',layoutSet:'economyPair',pairedUpperId:'LU8',exclusiveLayoutSet:true,name:'好景気',vp:0,special:'boom',costText:'🎲1/2×5',specialGroup:'economyLower',specialConfig:{vpFormula:{resources:['y'],divisor:6,round:'ceil'}},hooks:{turnStart:({api})=>{for(let p=0;p<api.playerCount;p++)for(const k of ['y','p','r'])api.resource(p,k,2,'boom')}},effectText:'このカードのVPは、所持している資金6個につき1VP（端数切り上げ）。ターン開始時、全プレイヤーは資金・食料・兵力を2ずつ獲得する。'},
  {id:'LL9',tier:'lower',layoutSet:'economyPair',pairedUpperId:'LU9',exclusiveLayoutSet:true,name:'不況',vp:0,special:'recession',costText:'🎲3/4/5/6×5',specialGroup:'economyLower',specialConfig:{vpFormula:{resources:['r','p'],divisor:6,round:'ceil'}},hooks:{turnStart:({api})=>{for(let p=0;p<api.playerCount;p++){api.addDebt(p,1);for(const k of ['y','p','r'])api.resource(p,k,-Math.min(1,api.powers[p][k]||0))}}},effectText:'このカードのVPは、所持している兵力と食料の合計6個につき1VP（端数切り上げ）。ターン開始時、全プレイヤーは負債1枚を獲得し、資金・食料・兵力を1ずつ失う。'},
  {id:'LU7',tier:'upper',name:'雲を貫く摩天楼',vp:8,special:'skyscraper',costText:'🎲3＋🎲4＋🎲5＋🎲6＋兵力10＋食料10',hooks:{turnStart:({owner,api})=>api.resource(owner,'y',5)},effectText:'ターン開始時、資金5を獲得する。ゲーム終了時、自分の負債を1枚につき+1VPとして扱う。'},
  {id:'LU8',tier:'upper',layoutSet:'economyPair',exclusiveLayoutSet:true,name:'黄金時代',vp:0,specialEffect:'goldenAge',special:'goldenAge',specialGroup:'economyUpper',costText:'条件を満たしたら獲得',effectText:'このカードのVPは資金3個につき1VP（端数切り上げ）から、兵力10未満の不足数と食料10未満の不足数を引いた値になる。獲得時、全員の負債をすべて捨て、全員の食料・兵力を1個につき資金1へ変換し、自分はさらに資金20を獲得する。以後、新たな負債は獲得できない。獲得ターン中、所有者は食料・兵力を獲得できない。次ターン以降も資金はサイコロ・命令書による資源変換と資源交換でのみ獲得でき、雇用・設置などの効果では獲得できない。'},
  {id:'LU9',tier:'upper',layoutSet:'economyPair',exclusiveLayoutSet:true,name:'世界恐慌',vp:0,specialEffect:'greatDepression',special:'greatDepression',specialGroup:'economyUpper',costText:'条件を満たしたら獲得',effectText:'このカードのVPは兵力と食料の合計4個につき1VP（端数切り上げ）から、資金10未満の不足数を引いた値になる。獲得時、全プレイヤーの資金を0にし、負債を10枚ずつ獲得する。以後、他プレイヤーの負債は1枚につき-2VP。所有者は負債を手札上限に含めず、捨てられず、負債のマイナスVPを無視し、負債10枚につき+1VP（端数切り上げ）。所有者は毎ターン開始時に食料と兵力を5個ずつ獲得する。獲得時に所有する他のレジェンドをすべて除外し、以後レジェンドを獲得できない。獲得ターン中、所有者は資金を獲得できない。次ターン以降も資金はサイコロ・命令書による資源変換と資源交換でのみ獲得でき、雇用・設置などの効果では獲得できない。'}
 ]
};
})();
