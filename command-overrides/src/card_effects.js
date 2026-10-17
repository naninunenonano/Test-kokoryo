// Editing source only. Build with npm run build; do not load this file directly.
// Section order and the shared private scope are preserved by src/order.json.

// @kokoryo-section S0021

function specialEffectId(c){return c?.specialEffect||c?.special||''}
const SPECIAL_EFFECT_DEFAULTS={
 goldenAge:{phase:'post',condition:{moneyPerTotalDebt:10},vpFormula:{resources:['y'],divisor:3,round:'ceil',penalties:[{resource:'r',target:10},{resource:'p',target:10}]},onAcquire:{clearAllDebt:true,convertAll:{from:['p','r'],to:'y',rate:1},gainOwner:{y:20},disableFutureDebt:true},resourceGain:{ownerBlock:['p','r'],acquireTurnAllSources:true,afterAcquireAllowedSources:['exchange','dieConvert']}},
 greatDepression:{phase:'pre',condition:{foodMilitaryBase:100,debtDiscount:10},vpFormula:{resources:['r','p'],divisor:4,round:'ceil',penalties:[{resource:'y',target:10}]},onAcquire:{clearAll:{resources:['y']},giveDebtAll:10},resourceGain:{ownerBlock:['y'],acquireTurnAllSources:true,afterAcquireAllowedSources:['exchange','dieConvert']},debt:{ignoreForOwnerHandLimit:true,ownerCannotDiscard:true,ownerDebtBonusDivisor:10,ownerDebtBonusRound:"ceil",finalVPPerDebt:-2}}
};
function mergeSpecialConfig(base,extra){let out={...(base||{}),...(extra||{})};for(const k of ['condition','vpFormula','onAcquire','resourceGain','debt'])if((base&&base[k])||(extra&&extra[k]))out[k]={...(base?.[k]||{}),...(extra?.[k]||{})};return out}
function specialConfig(c){return mergeSpecialConfig(SPECIAL_EFFECT_DEFAULTS[specialEffectId(c)]||{},c?.specialConfig||c?.effectConfig||{})}
function hasSpecialEffect(p,effectId){return allFieldCards(p).some(c=>specialEffectId(c)===effectId)}
function hasEraSpecial(p,effectId){return hasSpecialEffect(p,effectId)}
function specialOwners(filter){let out=[];for(let p=0;p<playerCount;p++)for(const c of allFieldCards(p)){let cfg=specialConfig(c);if(filter(cfg,c,p))out.push({p,c,cfg})}return out}
function goldenAgeOwner(){let x=specialOwners((cfg,c)=>specialEffectId(c)==='goldenAge')[0];return x?x.p:-1}
function greatDepressionOwner(){let x=specialOwners((cfg,c)=>specialEffectId(c)==='greatDepression')[0];return x?x.p:-1}
function depressionDebtLocked(p){return hasSpecialEffect(p,'greatDepression')}
function depressionLegendLocked(p){return depressionDebtLocked(p)}
function depressionProtectsDebtAtHandLimit(){return greatDepressionOwner()>=0}
// @kokoryo-end-section S0021

// @kokoryo-section S0023

function debtIgnoredForHand(p){return specialOwners((cfg,c,owner)=>owner===p&&cfg.debt?.ignoreForOwnerHandLimit).length>0}
// @kokoryo-end-section S0023

// @kokoryo-section S0025

function eraGainAllowed(p,key,source='effect'){for(const {c,cfg} of specialOwners((cfg,c,owner)=>owner===p&&Array.isArray(cfg.resourceGain?.ownerBlock)&&cfg.resourceGain.ownerBlock.includes(key))){if(c._eraAcquiredThisTurn&&cfg.resourceGain.acquireTurnAllSources)return false;let allowed=cfg.resourceGain.afterAcquireAllowedSources;if(Array.isArray(allowed)&&!allowed.includes(source))return false}return true}
// @kokoryo-end-section S0025

// @kokoryo-section S0036

function runRuleHook(name,ctx={}){activeRuleCards().forEach(rc=>{let fn=rc.hooks?.[name];if(typeof fn==='function')fn({...ctx,api:{discardMarketAndRefill(){blockAllMarketUndo('RC効果で市場を入れ替えました。');discard.push(...market);market=[];refillTo8()},addDebt(player,n=1){return acquireDebt(player,n)},notice(msg){triggerNotices.push(msg)}}})})}
// @kokoryo-end-section S0036

// @kokoryo-section S0045

function legendCostChoices(L){let faces=L.faces||[];let rs=[];unusedDice().filter(d=>faces.includes(d.value)).forEach(d=>rs.push({kind:'die',id:d.id,label:'🎲'+d.value+'（#'+d.id+'）'}));breadHands[turn].forEach((b,i)=>{let v=b.value;if(v==='any'||faces.includes(v))rs.push({kind:'bread',i,label:'命令書'+breadLabel(b)});});return rs}
function legendAnyChoices(){let rs=[];unusedDice().forEach(d=>rs.push({kind:'die',id:d.id,label:'🎲'+d.value}));breadHands[turn].forEach((b,i)=>rs.push({kind:'bread',i,label:'命令書'+breadLabel(b)}));return rs}
function legendAllFacesChoices(){let out=[],usedDice=new Set(),usedBread=new Set();for(let v=1;v<=6;v++){let d=unusedDice().find(x=>x.value===v&&!usedDice.has(x.id));if(d){usedDice.add(d.id);out.push({kind:'die',id:d.id});continue}let bi=breadHands[turn].findIndex((b,i)=>!usedBread.has(i)&&(b.value===v||b.value==='any'));if(bi<0)return null;usedBread.add(bi);out.push({kind:'bread',i:bi})}return out}
function payLegendResources(cost={}){for(let k of ['y','r','p'])if(powers[turn][k]<(cost[k]||0))return false;for(let k of ['y','r','p'])powers[turn][k]-=(cost[k]||0);return true}
function consumeLegendItems(items){
 let breadIdx=items.filter(x=>x.kind==='bread').map(x=>x.i).sort((a,b)=>b-a);
 items.filter(x=>x.kind==='die').forEach(x=>useDie(x.id));
 breadIdx.forEach(i=>breadDiscard.push(breadHands[turn].splice(i,1)[0]));recycleBreadIfEmpty();
}
function legendSameFaceChoices(face){let rs=[];unusedDice().filter(d=>d.value===face).forEach(d=>rs.push({kind:'die',id:d.id}));breadHands[turn].forEach((b,i)=>{if(b.value==='any'||b.value===face)rs.push({kind:'bread',i})});return rs}
function chooseNamedHireForLegend(){
 if((employees[turn]||[]).length>=effectiveHireLimit()){triggerNotices.push('《ビギニング・オブ・レジェンド》：雇用枠が上限のため雇用できませんでした。');return}
 let pool=['N','R','SR','SSR','UR'].flatMap(r=>implementedCastPool(r));
 if(!pool.length){triggerNotices.push('《ビギニング・オブ・レジェンド》：雇用可能なキャラクターがいません。');return}
 let modal=document.createElement('div');modal.className='imgmodal';modal.style.zIndex='10020';
 let box=document.createElement('div');box.className='game-confirm-box';box.style.maxWidth='900px';box.style.maxHeight='90vh';box.style.overflow='auto';
 let head=document.createElement('div');head.className='row';let title=document.createElement('strong');title.textContent='《ビギニング・オブ・レジェンド》：雇用するキャラクターを選択';let close=document.createElement('button');close.className='secondary';close.textContent='閉じる';close.onclick=()=>modal.remove();head.append(title,close);box.appendChild(head);
 let note=document.createElement('div');note.className='small';note.style.marginTop='6px';note.textContent='キャラクター名と能力を確認してタップしてください。';box.appendChild(note);
 let grid=document.createElement('div');grid.className='employee-card-grid';grid.style.marginTop='10px';grid.style.display='flex';grid.style.flexWrap='wrap';grid.style.gap='8px';
 pool.forEach(e=>{let wrap=document.createElement('div');wrap.className='employee-card-wrap';wrap.style.flex='1 1 150px';wrap.style.maxWidth='180px';let btn=document.createElement('button');btn.type='button';btn.className='employee-card';btn.style.width='100%';btn.style.textAlign='left';btn.style.cursor='pointer';btn.appendChild(employeeCardView(e));btn.onclick=()=>{let chosen=cardCommands.koyou('select',1,{pool,selected:cardCommands.choice(pool,1,{select:[e]}),accept:x=>employees[turn].push(x)})[0];if(!chosen)return;triggerNotices.push('《ビギニング・オブ・レジェンド》：'+chosen.rarity+'「'+castDisplayName(chosen)+'」を雇用しました。');modal.remove();renderGame()};wrap.appendChild(btn);grid.appendChild(wrap)});
 box.appendChild(grid);modal.appendChild(box);document.body.appendChild(modal);
}
function fieldDestroyCandidates(p){let a=[];(installed[p]||[]).forEach((c,i)=>{if(c.type!=='LEGEND')a.push({zone:'installed',i,c})});(temporary[p]||[]).forEach((c,i)=>{if(c.type!=='LEGEND')a.push({zone:'temporary',i,c})});return a}
function destroyChosenFieldCard(p,title){let a=fieldDestroyCandidates(p);if(!a.length)return null;let msg=a.map((x,i)=>(i+1)+'. '+x.c.name+(x.zone==='temporary'?'（仮設置）':'')).join('\n');let raw=turnClockPrompt(title+'\n捨てるカードを番号で選んでください。\n\n'+msg,'1');let n=Math.floor(+raw);if(!n||!a[n-1])n=1;let x=cardCommands.choice(a,1,{select:[n-1]})[0];return cardCommands.move(x.c,{zone:x.zone,owner:p},'discard')[0]}
function resolveScorchedEarth(owner){let first=destroyChosenFieldCard(owner,'《ジェネシスワールド》：まず自分のカードを1枚選択');if(first)triggerNotices.push('《ジェネシスワールド》：P'+(owner+1)+'の「'+first.name+'」を捨てました。');cardCommands.start(0,'all',{step:p=>{let c=destroyChosenFieldCard(p,'《ジェネシスワールド》：P'+(p+1)+'から1枚選択');if(c)triggerNotices.push('《ジェネシスワールド》：P'+(p+1)+'の「'+c.name+'」を捨てました。')}})}
function resolveGreatRefresh(){cardCommands.start(0,'all',{step:p=>{
 let n=cardCommands.count({zone:'hand',owner:p})+cardCommands.count({zone:'bread',owner:p});
 cardCommands.move(cardCommands.choice({zone:'hand',owner:p},'all'),{zone:'hand',owner:p},'discard');
 cardCommands.move(cardCommands.choice({zone:'bread',owner:p},'all'),{zone:'bread',owner:p},'breadDiscard');
 cardCommands.draw('deck',n,{owner:p});let gain=Math.floor(n/2);if(gain)for(const key of ['y','p','r'])cardCommands.pool(key,gain,{owner:p});
 triggerNotices.push('《メモリークラッシュ》：P'+(p+1)+'は負債を残し、'+n+'枚を捨て札にして通常カードを引き、資金・食料・兵力をそれぞれ'+gain+'個獲得しました。')
 }})}
let legendPaymentPending=false;
function selectLegendPayment(L,mode,needed,face=null){
 return new Promise(resolve=>{
  const owner=turn;
  const options=mode==='all'?legendAnyChoices():mode==='same'?legendSameFaceChoices(face):mode==='any'?legendAnyChoices():legendCostChoices(L);
  const selected=new Set();
  const overlay=document.createElement('div');overlay.className='imgmodal';overlay.style.zIndex='10040';
  const panel=document.createElement('div');panel.className='game-confirm-box';panel.style.cssText='width:min(94vw,580px);max-height:85vh;overflow:auto';
  const title=document.createElement('h3');title.textContent=L.name+'：サイコロ／命令書の選択';panel.appendChild(title);
  const guide=document.createElement('div');guide.className='small';guide.textContent='設置コスト：'+costTextForCard(L)+' ／ '+needed+'個を選択してください。';panel.appendChild(guide);
  const status=document.createElement('div');status.className='small';status.style.margin='10px 0';panel.appendChild(status);
  const grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:7px';panel.appendChild(grid);
  const buttons=[];
  function valid(){
   if(selected.size!==needed)return false;
   if(mode!=='all')return true;
   const counts=Array(7).fill(0);
   for(const i of selected){const o=options[i];if(o.kind==='die'){let d=unusedDice().find(x=>x.id===o.id);if(d)counts[d.value]++}else{let b=breadHands[owner][o.i];if(b&&b.value!=='any')counts[b.value]++}}
   const anys=[...selected].filter(i=>options[i].kind==='bread'&&breadHands[owner][options[i].i]?.value==='any').length;
   return counts.slice(1).every(n=>n<=1)&&counts.slice(1).filter(n=>n===0).length<=anys;
  }
  const actions=document.createElement('div');actions.className='row';actions.style.marginTop='14px';
  const cancel=document.createElement('button');cancel.className='secondary';cancel.textContent='キャンセル';
  const confirm=document.createElement('button');confirm.className='primary';confirm.textContent='選択したコストで獲得';
  function finish(result){overlay.remove();resolve(result)}
  overlay.dataset.turnClockPayment="true";overlay.__turnClockCancel=()=>finish(null);
  cancel.onclick=()=>finish(null);
  function redraw(){status.textContent=selected.size+'/'+needed+'個選択'+(mode==='all'?'（1～6の各出目が必要）':'');confirm.disabled=!valid();buttons.forEach((b,i)=>{b.style.outline=selected.has(i)?'3px solid #2369b4':''})}
  options.forEach((o,i)=>{let b=document.createElement('button');b.className='secondary';b.type='button';let d=o.kind==='die'?unusedDice().find(x=>x.id===o.id):null;b.textContent=o.label||(o.kind==='die'?'🎲'+(d?.value??'?')+' (#'+o.id+')':'命令書 '+breadLabel(breadHands[owner][o.i]));b.onclick=()=>{if(selected.has(i))selected.delete(i);else if(selected.size<needed)selected.add(i);redraw()};buttons.push(b);grid.appendChild(b)});
  confirm.onclick=()=>{if(turn!==owner||!valid())return;finish([...selected].map(i=>options[i]))};
  actions.append(cancel,confirm);panel.appendChild(actions);overlay.appendChild(panel);document.body.appendChild(overlay);redraw();
 });
}
async function takeLegend(id){
 if((onlineDebugMode||realOnlineMainMode)&&viewer!==turn)return alert('相手ターン中はレジェンドを獲得できません。');
 if(depressionLegendLocked(turn))return alert('《世界恐慌》の所有者は他のレジェンドを獲得できません。');if(legendPaymentPending)return; if(legendTakenThisTurn)return alert('レジェンドカードは1ターンに1枚までです。');let L=legends.find(x=>x.id===id);if(!L||L.taken)return;if(specialEffectId(L)==='goldenAge'||specialEffectId(L)==='greatDepression')return alert('このレジェンドはターン開始時の確認ポップアップから獲得します。');if(!L.unlocked)return alert('まだ解放されていません。');
 if(L.tier==='lower'){
  if(L.special==='moneyLaundering'){if(powers[turn].y<20)return alert('資金20が必要です。');powers[turn].y-=20}
  else if(L.special==='boom'||L.special==='recession'){
   const faces=L.special==='boom'?[1,2]:[3,4,5,6];
   const options=legendAnyChoices().filter(o=>o.kind==='die'?faces.includes(unusedDice().find(d=>d.id===o.id)?.value):breadHands[turn][o.i]?.value==='any'||faces.includes(breadHands[turn][o.i]?.value));
   if(options.length<5)return alert('指定された出目のサイコロ／命令書が5個必要です。');
   legendPaymentPending=true;let chosen=await selectLegendPayment({...L,faces},'faces',5);legendPaymentPending=false;
   if(!chosen)return;consumeLegendItems(chosen)
  }
  else if(L.special==='talentRecruit'){if((employees[turn]||[]).length>=effectiveHireLimit())return alert('《ビギニング・オブ・レジェンド》には空き雇用枠が1つ必要です。');let rs=legendAnyChoices();if(rs.length<4)return alert('任意のサイコロ／命令書が4個必要です。');if(powers[turn].y<20)return alert('資金20が必要です。');legendPaymentPending=true;let chosen=await selectLegendPayment(L,'any',4);legendPaymentPending=false;if(!chosen)return;consumeLegendItems(chosen);powers[turn].y-=20}
  else if(L.special==='scorchedEarth'){let rs=legendAllFacesChoices();if(!rs)return alert('1～6のサイコロ／命令書を1個ずつそろえる必要があります。');if(powers[turn].y<4||powers[turn].r<4||powers[turn].p<4)return alert('資金・兵力・食料が4個ずつ必要です。');legendPaymentPending=true;let chosen=await selectLegendPayment(L,'all',6);legendPaymentPending=false;if(!chosen)return;consumeLegendItems(chosen);powers[turn].y-=4;powers[turn].r-=4;powers[turn].p-=4}
  else if(L.special==='greatRefresh'){let rs=legendAnyChoices();if(rs.length<4)return alert('任意のサイコロ／命令書が4個必要です。');if(powers[turn].y<3||powers[turn].r<3||powers[turn].p<3)return alert('資金・兵力・食料が3個ずつ必要です。');legendPaymentPending=true;let chosen=await selectLegendPayment(L,'any',4);legendPaymentPending=false;if(!chosen)return;consumeLegendItems(chosen);powers[turn].y-=3;powers[turn].r-=3;powers[turn].p-=3}
  else{let ri=L.resource==='資金'?'y':L.resource==='食料'?'p':'r';if(powers[turn][ri]<8)return alert(L.resource+'8が必要です。');let rs=legendCostChoices(L);if(rs.length<3)return alert('対応するサイコロ／命令書が3個必要です。');legendPaymentPending=true;let chosen=await selectLegendPayment(L,'faces',3);legendPaymentPending=false;if(!chosen)return;consumeLegendItems(chosen);powers[turn][ri]-=8}
 }else if(L.special==='changeOfHeart'){
  if(powers[turn].y<24)return alert('資金24が必要です。');let targets=[];for(let p=0;p<playerCount;p++)if(p!==turn)(employees[p]||[]).forEach((e,i)=>targets.push({p,i,e}));if(!targets.length)return alert('奪える雇用キャラクターがいません。');let msg=targets.map((x,i)=>(i+1)+'. P'+(x.p+1)+' '+x.e.rarity+' '+castDisplayName(x.e)).join('\n');let raw=turnClockPrompt('《シークレット・サーティーン》\n奪う雇用キャラクターを選んでください。\n\n'+msg,'1');let n=Math.floor(+raw);if(!n||!targets[n-1])return;let x=targets[n-1];powers[turn].y-=24;let e=cardCommands.choice({zone:'employees',owner:x.p},1,{select:[x.i]})[0];cardCommands.move(e,{zone:'employees',owner:x.p},{zone:'employees',owner:turn});triggerNotices.push('《シークレット・サーティーン》：P'+(x.p+1)+'の「'+castDisplayName(e)+'」をP'+(turn+1)+'が獲得しました。');
 }else if(L.special==='resourceWipe'){
  return alert('《'+L.name+'》はターン開始時の特殊取得でのみ獲得できます。');
 }else if(L.special==='abilityCopy'){
  let rs=legendAllFacesChoices();if(!rs)return alert('1～6のサイコロ／命令書を1個ずつそろえる必要があります。');if(powers[turn].y<4||powers[turn].r<4||powers[turn].p<4)return alert('資金・兵力・食料が4個ずつ必要です。');legendPaymentPending=true;let chosen=await selectLegendPayment(L,'all',6);legendPaymentPending=false;if(!chosen)return;consumeLegendItems(chosen);powers[turn].y-=4;powers[turn].r-=4;powers[turn].p-=4;
 }else if(L.special==='amanomurakumo'){
  let face=[2,3,4,5].find(v=>legendSameFaceChoices(v).length>=8);if(!face)return alert('2・3・4・5のいずれか同じ出目を8個そろえる必要があります。');legendPaymentPending=true;let chosen=await selectLegendPayment(L,'same',8,face);legendPaymentPending=false;if(!chosen)return;consumeLegendItems(chosen);
 }else if(L.special==='mayqueen'){
  if(powers[turn].y<16)return alert('資金16が必要です。');let rs=legendSameFaceChoices(2);if(rs.length<3)return alert('出目2のサイコロ／命令書が3個必要です。');legendPaymentPending=true;let chosen=await selectLegendPayment(L,'same',3,2);legendPaymentPending=false;if(!chosen)return;consumeLegendItems(chosen);powers[turn].y-=16;
 }else if(L.special==='eggharp'){
  if(powers[turn].r<12)return alert('兵力12が必要です。');let rs=legendSameFaceChoices(5);if(rs.length<3)return alert('出目5のサイコロ／命令書が3個必要です。');legendPaymentPending=true;let chosen=await selectLegendPayment(L,'same',3,5);legendPaymentPending=false;if(!chosen)return;consumeLegendItems(chosen);powers[turn].r-=12;
 }
 L.taken=true;legendTakenThisTurn=true;
 if(L.layoutSet&&L.exclusiveLayoutSet)legends.forEach(x=>{if(x!==L&&x.layoutSet===L.layoutSet&&x.tier===L.tier&&!x.taken){x.taken=true;x.eraBlocked=true}});
 if(L.tier==='lower'){if(L.layoutSet==='economyPair'){legends.filter(x=>x.tier==='upper'&&x.layoutSet==='economyPair'&&!x.taken&&!x.eraBlocked).forEach(x=>x.unlocked=true)}else{let U=legends.find(x=>x.tier==='upper'&&x.col===L.col);if(U&&!U.taken)U.unlocked=true}}
 let ef=L.tier==='upper'?(L.effectText||effectText({specialEffect:specialEffectId(L),special:specialEffectId(L)})):L.tier==='lower'?(L.effectText|| (L.special==='talentRecruit'?'雇用可能な任意の雇用キャラクターを1人雇用する。':L.special==='scorchedEarth'?'このカードを設置したとき、自分の場の通常カードを1枚選んで捨て札にする。\nその後、各プレイヤーの場の通常カードを1枚ずつ選んで捨て札にする。':L.special==='greatRefresh'?'このカードを設置したとき、全プレイヤーは通常カードと命令書をすべて捨て札にし、その合計枚数と同じ枚数の通常カードを引く。\nその後、各プレイヤーは自身が捨て札にしたカード2枚につき、資金・食料・兵力をそれぞれ1個ずつ獲得する。':'「'+L.target+'」のターン開始時に獲得する'+L.resource+'を3個増やす。\n「'+L.target+'」1枚につきVPを2増やす。')):effectText({specialEffect:specialEffectId(L),special:specialEffectId(L)});let card={key:L.id,name:L.name,type:'LEGEND',specialEffect:specialEffectId(L),special:specialEffectId(L)||'legend',specialConfig:L.specialConfig||L.effectConfig||null,vp:L.vp,effectText:ef};registerInstallation(turn,card);triggerNotices.push(L.name+'を獲得しました。');
 if(L.special==='talentRecruit')chooseNamedHireForLegend();
 if(L.special==='scorchedEarth')resolveScorchedEarth(turn);
 if(L.special==='greatRefresh')resolveGreatRefresh();
 if(L.special==='eggharp')resolveEggHarp(turn);
 if(L.special==='amanomurakumo'){renderGame();cardCommands['the end']();return}
 renderGame()
}
function chooseLegendCard(title,note,opts,onChoose,onCancel){
 let choiceSettled=false;const choiceOwner=turn,choiceClockToken=turnClockState?.token;const canChoose=()=>turnClockLeaseValid(choiceOwner,choiceClockToken)&&(!(onlineDebugMode||realOnlineMainMode)||viewer===choiceOwner);
 if(!canChoose())return;
 q('#legendChoiceCancel').style.display='';
 let m=q('#legendChoiceModal'),grid=q('#legendChoiceCards');q('#legendChoiceTitle').textContent=title;q('#legendChoiceNote').textContent=note||'';grid.innerHTML='';
 opts.forEach(x=>{let w=document.createElement('div');w.className='card selectable-card';w.style.justifyContent='flex-start';let c=x.c;if(c&&resolvedContentImage(c)){let img=document.createElement('img');img.src=resolvedContentImage(c);img.alt=c.name;img.className='cardimg';img.onerror=()=>{let ph=document.createElement('div');ph.className='muted';ph.textContent='イラスト未設定';img.replaceWith(ph)};w.appendChild(img)}else{let ph=document.createElement('div');ph.className='muted';ph.style.cssText='aspect-ratio:456/701;border:1px dashed #bbb;border-radius:6px;display:flex;align-items:center;justify-content:center;background:#fff;margin-bottom:7px;text-align:center';ph.textContent='イラスト未設定';w.appendChild(ph)}let nm=document.createElement('strong');nm.textContent=x.label||c?.name||'カード';w.appendChild(nm);if(c){let meta=document.createElement('div');meta.className='small';meta.style.marginTop='5px';meta.textContent='VP：'+(c.vp||0);w.appendChild(meta);let ef=document.createElement('div');ef.className='small';ef.style.marginTop='6px';ef.textContent=effectText(c);w.appendChild(ef)}w.onclick=()=>{if(choiceSettled||!canChoose()||turn!==choiceOwner)return;choiceSettled=true;m.classList.add('hidden');turnClockChoice=null;onChoose(x)};grid.appendChild(w)});
 q('#legendChoiceCancel').onclick=()=>{if(choiceSettled||!canChoose()||turn!==choiceOwner)return;choiceSettled=true;m.classList.add('hidden');turnClockChoice=null;if(onCancel)onCancel()};m.classList.remove('hidden');
}
function resolveEggHarp(owner,n=0){
 if(pendingParkPlayers.length){turnClockChoice={kind:'genesis',owner,n,waiting:'park'};renderGame();return}
 cardCommands.repeat(4,{index:n,done:()=>{turnClockChoice=null;renderGame()},step:(i,next)=>{
  let opts=[];cardCommands.choice({zone:'hand',owner},'all').forEach((c,j)=>opts.push({src:'hand',i:j,c,label:'手札：'+c.name}));cardCommands.choice('market','all').forEach((c,j)=>opts.push({src:'market',i:j,c,label:'市場：'+c.name}));
  if(!opts.length){turnClockChoice=null;renderGame();return}
  turnClockChoice={kind:'genesis',owner,n:i};
  chooseLegendCard('創世記','コストを無視して設置するカードを選択（'+(i+1)+'/4）',opts,o=>{
   if(o.src==='market')blockAllMarketUndo('創世記で市場カードを設置しました。');
   const c=cardCommands.toba({owner,card:o.c,from:o.src==='hand'?{zone:'hand',owner}:'market'});if(!c)return;
   triggerNotices.push('創世記：「'+c.name+'」をコスト無視で設置しました。');
   if(pendingParkPlayers.length){turnClockChoice={kind:'genesis',owner,n:i+1,waiting:'park'};renderGame()}else{renderGame();next()}
  },()=>renderGame())
 }})
}
// @kokoryo-end-section S0045

// @kokoryo-section S0051

function triggerLandGrab(installer){
 cardCommands.trigger('install',{actor:installer},{aggregate:true,when:owner=>owner!==installer,
  instances:owner=>cardCommands.count({zone:'installed',owner},c=>c.special==='landgrab'),effect:({owner,occurrences})=>{
   let gain=playerScaledGain()*occurrences;cardCommands.pool('y',gain,{owner});
   triggerNotices.push('納税発動：P'+(installer+1)+'がカードを設置したため、P'+(owner+1)+'は資金を'+gain+'個獲得。');
  }});
}
// @kokoryo-end-section S0051

// @kokoryo-section S0055

function gainNanban(color){if(pendingNanban<=0||!eraGainAllowed(turn,color,'effect'))return;gainResource(turn,color,2,'effect');pendingNanban--;renderGame()}
function gainTenkuCat(color){if(pendingTenkuCat<=0||!eraGainAllowed(turn,color,'effect'))return;gainResource(turn,color,1,'effect');pendingTenkuCat--;renderGame()}
function offerFreeResourceWipeLegend(){
 if((onlineDebugMode||realOnlineMainMode)&&viewer!==turn)return false;
 if(legendTakenThisTurn)return false;
 let L=legends.find(x=>x.special==='resourceWipe'&&!x.taken&&x.unlocked);if(!L)return false;
 let lower=legends.find(x=>x.tier==='lower'&&x.col===L.col);
 if(!cardCommands.can(lower,x=>!x||x.taken))return false;
 if(!turnClockConfirm('《'+L.name+'》\n真下に下位レジェンドがありません。コストなしで設置しますか？\n設置すると全員の資源を捨て、このターンを終了します。'))return false;
 L.taken=true;legendTakenThisTurn=true;
 cardCommands.toba({owner:turn,card:{key:L.id,name:L.name,type:'LEGEND',special:L.special,vp:L.vp,effectText:L.effectText},from:null,created:true});
 cardCommands.start(0,'all',{step:p=>cardCommands.remove('all',{owner:p})});
 triggerNotices.push('《神々の黄昏》：全プレイヤーの全資源を捨てました。');renderGame();cardCommands.end();return true
}
// @kokoryo-end-section S0055

// @kokoryo-section S0058

function normalTurnStartCandidate(c){
 if(!c||c.special==='mayqueen'||c.special==='abilityCopy'||c.special==='resourceWipe')return false;
 if(c.turnStartTiming==='pre'||c.turnStartTiming==='post'||c.turnStartPhase==='pre'||c.turnStartPhase==='post')return false;
 if(c.hooks?.turnStartPre||c.hooks?.turnStartPost)return false;
 return c.turnStartTiming==='normal'||c.turnStartPhase==='normal'||typeof c.hooks?.turnStart==='function'||
 ['mine','farm','barracks','commandroom','church','greatermine','greaterfarm','greaterbarracks','greatercommand','bandit','nanban','tenkucat','skyscraper'].includes(c.special);
}
function repeatTurnStartEffect(c,times){
 let y0=powers[turn].y,p0=powers[turn].p,r0=powers[turn].r,drawnCards=[],drawnBread=[];
 for(let n=0;n<times;n++){
  const program=normalEffectProgram(c);
  if(program){let results=cardCommands.cast(program);for(let i=0;i<program.length;i++)if(program[i][0]==='draw'){if(program[i][1]==='command')drawnBread.push(...results[i].cards.map(breadLabel));else drawnCards.push(...results[i].cards.map(x=>x.name))}}
  else if(c.special==='skyscraper')cardCommands.pool('y',5);
  else if(c.special==='nanban')pendingNanban++;
  else if(c.special==='tenkucat')pendingTenkuCat++;
  else if(typeof c.hooks?.turnStart==='function')runPackCardHook(c,'turnStart',{owner:turn});
 }
 let parts=[];if(powers[turn].y-y0)parts.push('資金+'+(powers[turn].y-y0));if(powers[turn].p-p0)parts.push('食料+'+(powers[turn].p-p0));if(powers[turn].r-r0)parts.push('兵力+'+(powers[turn].r-r0));if(drawnBread.length)parts.push('命令書「'+drawnBread.join('」「')+'」を獲得');if(drawnCards.length)parts.push('「'+drawnCards.join('」「')+'」をドロー');if(!parts.length)parts.push('追加効果の結果なし');return parts.join('、');
}
function resolveMayQueen(qn=0,repeat=0){
 let queenCards=installed[turn].filter(c=>c.special==='mayqueen'),queens=queenCards.length;
 if(qn>=queens)return;
 if(repeat>=2||!cardCommands.once(2,'turn',{usage:stdAbilityUsed,cardId:'cast:'+commandInstanceId(queenCards[qn])})){resolveMayQueen(qn+1,0);return}
 let opts=installed[turn].filter(normalTurnStartCandidate).map(c=>({c,label:c.name}));
 if(!opts.length){triggerNotices.push('ユグドラシル：通常ターン開始時効果の対象がありません。');renderGame();return}
 if((onlineDebugMode||realOnlineMainMode)&&viewer!==turn)return;
 turnClockChoice={kind:'yggdrasil',qn,repeat};
 chooseLegendCard('ユグドラシル','通常のターン開始時効果を選んで発動（'+(repeat+1)+'/2）',opts,o=>{
  if((onlineDebugMode||realOnlineMainMode)&&viewer!==turn)return;
  if(!cardCommands.once(2,'turn',{usage:stdAbilityUsed,cardId:'cast:'+commandInstanceId(queenCards[qn]),consume:true}))return;let result=repeatTurnStartEffect(o.c,1);
  triggerNotices.push('ユグドラシル：'+o.c.name+' → '+result);
  renderGame();resolveMayQueen(qn,repeat+1);
 },()=>{cardCommands.once(2,'turn',{usage:stdAbilityUsed,cardId:'cast:'+commandInstanceId(queenCards[qn]),consume:true});resolveMayQueen(qn,repeat)});
}
function resolveTurnStartEffects(){
 let lord=CHARACTER_DATA[charOf(turn)]||{},lordBreadCount=(lord.turnBread||0);
 if(lordBreadCount&&lord.firstBreadBonus&&cardCommands.once(1,'game',{usage:lordFirstBreadUsed,cardId:turn})){lordBreadCount+=lord.firstBreadBonus;cardCommands.once(1,'game',{usage:lordFirstBreadUsed,cardId:turn,consume:true})}
 let lordBreadDraws=cardCommands.draw('command',lordBreadCount).cards.map(breadLabel);
 if(lordBreadDraws.length)triggerNotices.push(lord.uniqueAbility+'：命令書「'+lordBreadDraws.join('」「')+'」を獲得しました。');
 let staffBreadDraws=[];(employees[turn]||[]).forEach(e=>{if(!employeeUniqueAbilitiesEnabled(turn))return;let count=e.turnBread||0;if(count&&e.firstBreadBonus&&cardCommands.once(1,'game',{usage:e,cardId:'_firstBreadUsed'})){count+=e.firstBreadBonus;cardCommands.once(1,'game',{usage:e,cardId:'_firstBreadUsed',consume:true})}staffBreadDraws.push(...cardCommands.draw('command',count).cards.map(breadLabel))});
 if(staffBreadDraws.length)triggerNotices.push('キャスト《神算鬼謀》：命令書「'+staffBreadDraws.join('」「')+'」を獲得しました。');
 // 《オーバークロック》：各所持者ごとに未発動なら一度だけ、任意配分で合計20資源。
 if(lord.overclockResources&&cardCommands.once(1,'game',{usage:lordOverclockUsed,cardId:turn})){pendingOverclockChoices.push({name:lord.name,remaining:lord.overclockResources});cardCommands.once(1,'game',{usage:lordOverclockUsed,cardId:turn,consume:true})}
 (employees[turn]||[]).forEach(e=>{if(employeeUniqueAbilitiesEnabled(turn)&&e.overclockResources&&cardCommands.once(1,'game',{usage:e,cardId:'_overclockUsed'})){pendingOverclockChoices.push({name:e.name,remaining:e.overclockResources});cardCommands.once(1,'game',{usage:e,cardId:'_overclockUsed',consume:true})}});
 // 《神の見えざる手》：各所持者の能力値だけ通常山札からドロー。
 let invisibleCount=(lord.invisibleHand||0)+(employeeUniqueAbilitiesEnabled(turn)?(employees[turn]||[]):[]).reduce((n,e)=>n+(e.invisibleHand||0),0),invisibleDraws=[];
 invisibleDraws=cardCommands.draw('deck',invisibleCount).cards.map(c=>c.name)
 if(invisibleDraws.length)triggerNotices.push('《神の見えざる手》：山札から「'+invisibleDraws.join('」「')+'」を引きました。');
 pendingNanban=installed[turn].filter(c=>c.special==='nanban').length;pendingTenkuCat=installed[turn].filter(c=>c.special==='tenkucat').length;
 let mine=installed[turn].filter(c=>c.special==='mine').length,farm=installed[turn].filter(c=>c.special==='farm').length,barracks=installed[turn].filter(c=>c.special==='barracks').length,commandroom=installed[turn].filter(c=>c.special==='commandroom').length,church=installed[turn].filter(c=>c.special==='church').length;
 let greaterMine=installed[turn].filter(c=>c.special==='greatermine').length,greaterFarm=installed[turn].filter(c=>c.special==='greaterfarm').length,greaterBarracks=installed[turn].filter(c=>c.special==='greaterbarracks').length,greaterCommand=installed[turn].filter(c=>c.special==='greatercommand').length;

 let mineBoost=cardCommands.boost(0,3,{count:installed[turn].some(c=>c.special==='legendmine')?1:0}),farmBoost=cardCommands.boost(0,3,{count:installed[turn].some(c=>c.special==='legendfarm')?1:0}),barracksBoost=cardCommands.boost(0,3,{count:installed[turn].some(c=>c.special==='legendbarracks')?1:0});
 if(mine)cardCommands.pool('y',mine*(1+mineBoost),{respectRestrictions:false});if(farm)cardCommands.pool('p',farm*(1+farmBoost),{respectRestrictions:false});if(barracks)cardCommands.pool('r',barracks*(1+barracksBoost),{respectRestrictions:false});
 if(greaterMine)cardCommands.pool('y',greaterMine*3,{respectRestrictions:false});if(greaterFarm)cardCommands.pool('p',greaterFarm*3,{respectRestrictions:false});if(greaterBarracks)cardCommands.pool('r',greaterBarracks*3,{respectRestrictions:false});
 let commandDraws=cardCommands.draw('command',commandroom).cards.map(breadLabel);
 let greaterCommandDraws=cardCommands.draw('command',greaterCommand*2).cards.map(breadLabel);
 let churchDraws=cardCommands.draw('deck',church).cards.map(c=>c.name);
 if(mine||farm||barracks)triggerNotices.push('スタンダードのターン開始時効果：'+(mine?'資金+'+(mine*(1+mineBoost))+' ':'')+(farm?'食料+'+(farm*(1+farmBoost))+' ':'')+(barracks?'兵力+'+(barracks*(1+barracksBoost))+' ':''));
 if(commandDraws.length)triggerNotices.push('司令室：命令書「'+commandDraws.join('」「')+'」を獲得しました。');
 if(greaterMine||greaterFarm||greaterBarracks)triggerNotices.push('上位施設のターン開始時効果：'+(greaterMine?'資金+'+(greaterMine*3)+' ':'')+(greaterFarm?'食料+'+(greaterFarm*3)+' ':'')+(greaterBarracks?'兵力+'+(greaterBarracks*3)+' ':''));
 if(greaterCommandDraws.length)triggerNotices.push('大司令部：命令書「'+greaterCommandDraws.join('」「')+'」を獲得しました。');
 if(churchDraws.length)triggerNotices.push('教会：山札から「'+churchDraws.join('」「')+'」を引きました。');
 let bandits=installed[turn].filter(c=>c.special==='bandit').length;if(bandits){let rich=cardCommands.count('players',p=>p!==turn&&cardCommands.count('resources',()=>true,{owner:p})>=5);let gain=rich*playerScaledGain()*bandits;if(gain){cardCommands.pool('y',gain,{respectRestrictions:false});triggerNotices.push('義賊：資源合計5個以上の他プレイヤー'+rich+'人を参照し、資金'+gain+'個を獲得。')}}
 // ユグドラシルはpostで処理するため、ここでは発動しない。
}
// @kokoryo-end-section S0058

// @kokoryo-section S0060

// 金融レジェンドは下位のどちらかを獲得すると上位の両方が解放される。
// 保存状態・デバッグ操作・公開場更新後も解放状態を再計算する。
function syncEconomyLegendUnlock(){
 const lower=legends.filter(L=>L.tier==='lower'&&L.layoutSet==='economyPair');
 const upper=legends.filter(L=>L.tier==='upper'&&L.layoutSet==='economyPair');
 const ownedLowerIds=new Set(installed.flat().filter(c=>c.key==='LL8'||c.key==='LL9').map(c=>c.key));
 if(ownedLowerIds.size){for(const L of lower){if(ownedLowerIds.has(L.id)){L.taken=true;L.eraBlocked=false}else{L.taken=true;L.eraBlocked=true}}}

 if(!lower.some(L=>L.taken&&!L.eraBlocked)&&!installed.some(cards=>(cards||[]).some(c=>c.key==='LL8'||c.key==='LL9')))return;
 for(const L of upper)if(!L.taken&&!L.eraBlocked)L.unlocked=true;
}
// 診断専用。対戦処理は変更せず、ターン開始時の実行履歴だけ保持する。
let economyAcquireTrace=[];
function traceEconomyAcquire(stage,details={}){
 try{
  economyAcquireTrace.push({stage,turnPlayer:turn+1,viewerPlayer:viewer+1,
   onlineDebug:!!onlineDebugMode,realOnline:!!realOnlineMainMode,
   money:powers[turn]?.y||0,food:powers[turn]?.p||0,military:powers[turn]?.r||0,
   ownDebt:commandCounts[turn]||0,totalDebt:commandCounts.reduce((a,n)=>a+(n||0),0),
   legendTakenThisTurn:!!legendTakenThisTurn,...details});
  if(economyAcquireTrace.length>80)economyAcquireTrace.shift();
 }catch(e){}
}
function runTurnStartSpecialAcquirePhase(timing){
 traceEconomyAcquire('phase_enter',{timing});
 if((onlineDebugMode||realOnlineMainMode)&&viewer!==turn){traceEconomyAcquire('phase_skipped_viewer',{timing});return false;}
 // ① pre: ターン開始時効果より前に条件判定する特殊獲得。③ post: 開始時効果処理後に条件判定する特殊獲得。
 let acquired=false;
 if(timing==='pre'){syncEconomyLegendUnlock();runInstalledPackHooks('turnStartAcquirePre',turn);if(offerFreeResourceWipeLegend())return true;offerEraLegendAtTurnStart('pre')}
 if(timing==='post'){syncEconomyLegendUnlock();runInstalledPackHooks('turnStartAcquirePost',turn);offerEraLegendAtTurnStart('post')}
 traceEconomyAcquire('phase_exit',{timing});
 return acquired
}
function ensureDepressionDebtSupply(){for(const L of legends.filter(x=>!x.taken&&!x.eraBlocked&&x.unlocked)){let n=specialConfig(L).onAcquire?.ensureDebtSupplyPerPlayer;if(n){let total=komePlace+commandCounts.reduce((a,v)=>a+(v||0),0),need=playerCount*n;if(total<need)komePlace+=need-total}}}
function eraLegendCondition(L){
 if(legendTakenThisTurn||depressionLegendLocked(turn))return false;
 const c=specialConfig(L).condition||{},total=commandCounts.reduce((a,n)=>a+(n||0),0);
 if(c.moneyPerTotalDebt!=null)return (powers[turn]?.y||0)>=total*c.moneyPerTotalDebt;
 if(c.foodMilitaryBase!=null)return ((powers[turn]?.p||0)+(powers[turn]?.r||0))>=Math.max(0,c.foodMilitaryBase-(commandCounts[turn]||0)*(c.debtDiscount||0));
 if(c.debtTotalAtLeast!=null&&total<c.debtTotalAtLeast)return false;
 if(c.allDebtZero&&!commandCounts.every(n=>(n||0)===0))return false;
 return Object.keys(c).length>0;
}
function blockOtherEraLegend(chosen){
 if(chosen.layoutSet&&chosen.exclusiveLayoutSet){legends.forEach(L=>{if(L!==chosen&&L.layoutSet===chosen.layoutSet&&L.tier===chosen.tier&&!L.taken){L.eraBlocked=true;L.taken=true}});return}
 let group=chosen.specialGroup||'era';legends.forEach(L=>{if(L!==chosen&&(L.specialGroup||'era')===group&&!L.taken)L.eraBlocked=true});
}
function resolveEraAcquire(L){
 if(legendTakenThisTurn||depressionLegendLocked(turn)||!eraLegendCondition(L))return false;
 let cfg=specialConfig(L),a=cfg.onAcquire||{},owner=turn;
 if(specialEffectId(L)==='goldenAge')powers[owner].y=0;
 if(specialEffectId(L)==='greatDepression'){powers[owner].y=0;powers[owner].p=0;powers[owner].r=0;
  installed[owner]=installed[owner].filter(c=>c.type!=='LEGEND');temporary[owner]=temporary[owner].filter(c=>c.type!=='LEGEND');
 }
 L.taken=true;legendTakenThisTurn=true;blockOtherEraLegend(L);
 let card={key:L.id,name:L.name,type:'LEGEND',specialEffect:specialEffectId(L),special:specialEffectId(L),specialConfig:L.specialConfig||L.effectConfig||null,specialGroup:L.specialGroup||'era',vp:L.vp??0,_eraAcquiredThisTurn:true,effectText:L.effectText||''};
 registerInstallation(owner,card);
 if(a.clearAllDebt){let returned=commandCounts.reduce((x,n)=>x+(n||0),0);commandCounts=commandCounts.map(()=>0);komePlace+=returned}
 if(a.clearAll?.resources)for(let p=0;p<playerCount;p++)for(const k of a.clearAll.resources)powers[p][k]=0;
 if(a.convertAll)for(let p=0;p<playerCount;p++){let gain=0;for(const k of a.convertAll.from||[]){gain+=(powers[p][k]||0)*(a.convertAll.rate||1);powers[p][k]=0}powers[p][a.convertAll.to]=(powers[p][a.convertAll.to]||0)+gain}
 if(a.gainOwner)for(const [k,n] of Object.entries(a.gainOwner))powers[owner][k]=(powers[owner][k]||0)+n;
 if(a.giveDebtAll)distributeLimitedAcquisition(owner,'all',a.giveDebtAll,(p,n)=>acquireDebt(p,n));
 triggerNotices.push('《'+L.name+'》をターン開始時に獲得しました。');renderGame();return true;
}
function offerEraLegendAtTurnStart(timing){
 if((onlineDebugMode||realOnlineMainMode)&&viewer!==turn){traceEconomyAcquire('offer_skipped_viewer',{timing});return false}
 let opts=legends.filter(L=>!L.taken&&!L.eraBlocked&&L.unlocked&&specialConfig(L).phase===timing&&eraLegendCondition(L));
 traceEconomyAcquire('offer_candidates',{timing,candidates:opts.map(L=>L.id),finance:legends.filter(L=>L.id==='LU8'||L.id==='LU9').map(L=>({id:L.id,taken:!!L.taken,blocked:!!L.eraBlocked,unlocked:!!L.unlocked,phase:specialConfig(L).phase,conditionMet:eraLegendCondition(L)}))});
 if(!opts.length)return false;
 for(const L of opts){
  traceEconomyAcquire('confirm_before',{timing,id:L.id});
  let accepted=turnClockConfirm('《'+L.name+'》の獲得条件を満たしています。\n'+(timing==='pre'?'ターン開始時の効果処理前':'ターン開始時の効果処理後')+'に獲得しますか？');
  traceEconomyAcquire('confirm_after',{timing,id:L.id,accepted});
  if(accepted){let result=resolveEraAcquire(L);traceEconomyAcquire('acquire_result',{timing,id:L.id,result});return result}
 }
 return false;
}
// @kokoryo-end-section S0060

// @kokoryo-section S0064

function dynamicSpecialVP(c,p){let f=specialConfig(c).vpFormula;if(!f)return null;let sum=(f.resources||[]).reduce((n,k)=>n+(powers[p]?.[k]||0),0),d=Math.max(1,+f.divisor||1),v=f.round==='floor'?Math.floor(sum/d):f.round==='round'?Math.round(sum/d):Math.ceil(sum/d);for(const x of f.penalties||[])v-=Math.max(0,(+x.target||0)-(powers[p]?.[x.resource]||0))*(+x.multiplier||1);return v+(+f.flat||0)}
function cardVP(c,p){
 if(c.special==='greatDepression')return dynamicSpecialVP(c,p)+Math.ceil((commandCounts[p]||0)/10);
 if(c.special==='bigCompany')return (employees[p]||[]).length;
 if(c.special==='naroppaFestival'){let keys=new Set(['S1','S2','S3','S4','S5','S6','S7','S8','S9','S10']);return allFieldCards(p).filter(x=>keys.has(x.key)).reduce((n,x)=>n+fixedVP(x),0)*2;}
 if(c.special==='naroppaGuild')return Math.floor(((powers[p]?.y||0)+(powers[p]?.p||0)+(powers[p]?.r||0))/3);
 let dyn=dynamicSpecialVP(c,p);if(dyn!==null)return dyn;
 if(c.special==='treasureship'){
  let base=allFieldCards(p).filter(x=>x.type==='S').reduce((a,x)=>a+cardVP(x,p),0);
  return base*2;
 }
 if(c.special==='inadamashii'){
  let pw=powers[p];return Math.floor((pw.y+pw.r+pw.p)/3);
 }
 let boostMap={mine:'legendmine',farm:'legendfarm',barracks:'legendbarracks'};
 if(boostMap[c.special]&&allFieldCards(p).some(x=>x.special===boostMap[c.special]))return cardCommands.function({target:[c],value:fixedVP,flat:2});
 return fixedVP(c);
}
// @kokoryo-end-section S0064

// @kokoryo-section S0081

function installNightEscape(){
 if(!nightEscapePostAvailable||!isViewingOwnTurn())return;
 if(pendingLordResource>0||pendingNanban>0||pendingTenkuCat>0||pendingSSRBonus>0||pendingCastResourceChoices.length||pendingOverclockChoices.length)return;
 let i=hands[turn].findIndex(c=>c.key==='N22');if(i<0||(commandCounts[turn]||0)<5)return;
 nightEscapePostAvailable=false;
 let card=hands[turn].splice(i,1)[0];
 let n=depressionDebtLocked(turn)?0:(commandCounts[turn]||0);if(n){commandCounts[turn]=0;komePlace+=n;}
 powers[turn]={y:0,p:0,r:0};
 breadDiscard.push(...breadHands[turn].splice(0));recycleBreadIfEmpty();
 dice.forEach(d=>d.used=true);
 nightEscapeResetNext[turn]=true;
 registerInstallation(turn,card);
 pendingOverclockChoices.push({name:'夜逃げ',label:'《夜逃げ》',remaining:4,total:4});
 triggerNotices.push('《夜逃げ》：負債・資源・命令書をすべて捨てました。次のターン開始時に1回限りの効果を再発動します。');renderGame();
}
// @kokoryo-end-section S0081

// @kokoryo-section S0083

function consumeOneOf(choice,values){if(String(choice).startsWith('free:request:')&&lordInstallDiceDiscount()>Number(String(choice).split(':')[2]))return true;for(let v of values){let [k,n]=String(choice).split(':');if(k==='d'){let d=unusedDice().find(x=>x.id===+n&&x.value===v);if(d){d.used=true;return true}}else if(k==='b'){let i=+n,b=breadHands[turn][i];if(b&&(b.value==='any'||b.value===v)){breadDiscard.push(breadHands[turn].splice(i,1)[0]);recycleBreadIfEmpty();return true}}}return false}
function installStandard(handIndex,choice){let c=hands[turn][handIndex],p=powers[turn];if(!c||c.type!=='S')return;let need={y:0,r:0,p:0},vals=null;
 if(c.special==='plan')need.r=2;else if(c.special==='adjust')need.r=4;else if(c.special==='restrict'||c.special==='permit')need.r=3;
 else if(c.special==='mine'){need.y=2;vals=[1,2]}else if(c.special==='farm'){need.p=2;vals=[3,4]}else if(c.special==='barracks'){need.r=2;vals=[5,6]}
 else if(c.special==='commandroom'){need.y=3;need.r=1;vals=[3,4]}else if(c.special==='warehouse')vals=[1,3,5];else if(c.special==='church'){need.y=3;need.p=1;vals=[1,4]}
 if(p.y<need.y||p.r<need.r||p.p<need.p)return alert('資源が足りません。必要：'+c.costText);if(vals&&!consumeOneOf(choice,vals))return alert('必要な出目を満たすサイコロまたは命令書を選んでください。');
 p.y-=need.y;p.r-=need.r;p.p-=need.p;let got=hands[turn].splice(handIndex,1)[0];registerInstallation(turn,got);renderGame()}
function useStdAbility(cardId,mode,dieId,delta=0){let key=cardId;if(!cardCommands.once(1,'turn',{cardId:key,usage:stdAbilityUsed}))return;let d=dice.find(x=>x.id===+dieId&&!x.used);if(!d)return alert('未使用のサイコロを選んでください。');if(mode==='plan')cardCommands.dice('reroll',{dieId});if(mode==='adjust')cardCommands.dice('adjust',{dieId,delta});if(mode==='restrict')cardCommands.dice('set',{dieId,value:1});if(mode==='permit')cardCommands.dice('set',{dieId,value:6});cardCommands.once(1,'turn',{cardId:key,usage:stdAbilityUsed,consume:true});renderGame()}
// @kokoryo-end-section S0083

// @kokoryo-section S0085

function installedDisplayList(p){return [...(temporary[p]||[]).map(card=>({card,status:'仮設置'})),...(installed[p]||[]).map(card=>({card,status:'設置'}))]}
// @kokoryo-end-section S0085

// @kokoryo-section S0087

function useRecreation(){
 let range=recreationRangeForTurn();if(!range)return;
 if(!installed[turn].length)return alert('《リクリエイション》の対象になる設置済みカードがありません。');
 if(!hands[turn].length)return alert('《リクリエイション》で仮設置する手札がありません。');
 let bases=installed[turn].map((c,i)=>({c,i,targets:hands[turn].map((h,j)=>({h,j})).filter(x=>x.h.type!=='LEGEND'&&!x.h.tier&&cardCommands.can(x.h,h=>Math.abs(fixedVP(h)-fixedVP(c))<=range))})).filter(x=>x.targets.length&&x.c.type!=='LEGEND'&&!x.c.tier&&!String(x.c.id||'').match(/^L[LU]/));
 if(!bases.length)return alert('VP差が±'+range+'以内になる組み合わせがありません。');
 let host=q('#installedcards'),old=q('#recreationPicker');if(old)old.remove();
 let box=document.createElement('div');box.id='recreationPicker';box.className='panel';box.style.marginTop='8px';
 let title=document.createElement('div');title.className='small';title.textContent='《リクリエイション》 入れ替えるカードを選択';box.appendChild(title);
 let baseSel=document.createElement('select');baseSel.style.width='100%';baseSel.style.marginTop='6px';
 bases.forEach((x,n)=>{let o=document.createElement('option');o.value=n;o.textContent='設置済み：'+x.c.name+'（'+fixedVP(x.c)+'VP）';baseSel.appendChild(o)});box.appendChild(baseSel);
 let handSel=document.createElement('select');handSel.style.width='100%';handSel.style.marginTop='6px';box.appendChild(handSel);
 function refreshTargets(){handSel.innerHTML='';let b=bases[+baseSel.value];b.targets.forEach((x,n)=>{let o=document.createElement('option');o.value=n;o.textContent='手札：'+x.h.name+'（'+fixedVP(x.h)+'VP）';handSel.appendChild(o)})}
 baseSel.onchange=refreshTargets;refreshTargets();
 let exec=document.createElement('button');exec.textContent='入れ替える';exec.style.marginTop='6px';exec.onclick=()=>{let b=bases[+baseSel.value],t=b?.targets[+handSel.value];if(!b||!t)return;let oldCard=b.c,next=t.h;if(!cardCommands.can(oldCard,'installed')||!hands[turn].includes(next))return;oldCard=cardCommands.choice('installed',1,{select:[oldCard]})[0];next=cardCommands.choice('hand',1,{select:[next]})[0];cardCommands.move(oldCard,'installed','discard');cardCommands.toba({card:next,from:'hand'});triggerNotices.push('《リクリエイション》：「'+oldCard.name+'」を捨て、「'+next.name+'」を仮設置しました。');renderGame()};box.appendChild(exec);
 let cancel=document.createElement('button');cancel.className='secondary';cancel.textContent='キャンセル';cancel.style.margin='6px 0 0 6px';cancel.onclick=()=>box.remove();box.appendChild(cancel);
 host.appendChild(box);
}
// @kokoryo-end-section S0087

// @kokoryo-section S0089


function consumeThreeAny(a,b,c){if(!a||!b||!c||new Set([a,b,c]).size<3)return false;return consumeCostChoice(a)&&consumeCostChoice(b)&&consumeCostChoice(c)}
// @kokoryo-end-section S0089

// @kokoryo-section S0091

function installNewNormal(handIndex,choices){let c=hands[turn][handIndex],p=powers[turn];if(!c)return;let ok=false;
 if(c.special==='famine'){if(p.p<3)return alert('食料3が必要です。');if(choices.length<3||new Set(choices).size<3)return alert('異なる3枚/3個を選んでください。');ok=choices.every(ch=>consumeCostChoice(ch,3));if(!ok)return alert('🎲3を3個満たしてください。');p.p-=3}
 else if(c.special==='swordhunt'){if(p.r<4)return alert('兵力4が必要です。');if(!consumeCostChoice(choices[0],6))return alert('🎲6が必要です。');p.r-=4}
 else if(c.special==='laws'){if(p.y<5)return alert('資金5が必要です。');p.y-=5}
 else if(c.special==='graveyard'){if(p.p<1||p.r<2)return alert('食料1・兵力2が必要です。');if(!consumeOneOf(choices[0],[4,5]))return alert('🎲4または5が必要です。');p.p--;p.r-=2}
 else if(c.special==='landgrab'){if(p.y<2||p.p<2||p.r<2)return alert('資金・食料・兵力が2個ずつ必要です。');if(choices.length<2||new Set(choices).size<2)return alert('異なる2枚/2個を選んでください。');if(!consumeCostChoice(choices[0],2)||!consumeCostChoice(choices[1],5))return alert('🎲2と🎲5が必要です。');p.y-=2;p.p-=2;p.r-=2}
 else if(c.special==='bandit'){if(p.y<4||p.p<3)return alert('資金4・食料3が必要です。');if(choices.length<3||new Set(choices).size<3)return alert('異なる3枚/3個を選んでください。');if(!consumeThreeAny(...choices))return alert('任意のサイコロ3個が必要です。');p.y-=4;p.p-=3}
 else if(c.special==='publicmarket'){if(p.y<1||p.p<1||p.r<1)return alert('資金・食料・兵力が1個ずつ必要です。');if(!consumeCostChoice(choices[0]))return alert('任意のサイコロ1個が必要です。');p.y--;p.p--;p.r--}
 else if(c.special==='scout'){if(!cardCommands.can(null,'hire-space'))return alert('雇用枠が上限のため設置できません。');if(p.y<2||p.p<2||p.r<2)return alert('資金・食料・兵力が2個ずつ必要です。');p.y-=2;p.p-=2;p.r-=2}

 else return;
 let got=hands[turn].splice(handIndex,1)[0];registerInstallation(turn,got);renderGame()
}
let graveyardUsed=[],publicMarketUsed=[];
// プレイヤーごとの「カード個体ID → 使用済み」を既存の同期・保存に載せる。
// 旧版の true は、次の自分のターンまで全個体使用済みとして扱う。
function normalCardActionUsed(usage,card){return !cardCommands.once(1,'turn',{cardId:card.id,usage,owner:turn})}
function useGraveyard(cardIndex){
 if(!isViewingOwnTurn())return;
 const owner=turn,c=installed[owner]?.[cardIndex];
 if(!c||c.special!=='graveyard')return;
 if(normalCardActionUsed(graveyardUsed,c))return alert('このオルフェンズはこのターン使用済みです。');
 if(!discard.length)return alert('捨て札がありません。');
 let colors=[['y','資金'],['p','食料'],['r','兵力']].filter(([k])=>powers[owner][k]>0);
 if(!colors.length)return alert('消費できる資源がありません。');
 let opts=cardCommands.choice('discard','all').map((c,i)=>({c,i,label:c.name}));
 chooseLegendCard('オルフェンズ','回収するカードをタップしてください。',opts,o=>{
  let m=q('#legendChoiceModal'),grid=q('#legendChoiceCards');
  q('#legendChoiceTitle').textContent='消費する資源';
  q('#legendChoiceNote').textContent='資金・食料・兵力のうち1個をタップして消費します。';
  grid.innerHTML='';
  colors.forEach(([k,n])=>{
   let b=document.createElement('button');b.className='secondary';b.style.padding='14px';
   b.textContent=n+'（所持 '+powers[owner][k]+'）';
   b.onclick=()=>{
    if(turn!==owner||!isViewingOwnTurn()||!installed[owner].includes(c)||normalCardActionUsed(graveyardUsed,c)||powers[owner][k]<1)return;
    let i=discard.indexOf(o.c);if(i<0)return;
    m.classList.add('hidden');powers[owner][k]--;cardCommands.move(o.c,'discard',{zone:'hand',owner});
    cardCommands.once(1,'turn',{cardId:c.id,usage:graveyardUsed,owner,consume:true});renderGame();
   };
   grid.appendChild(b);
  });
  q('#legendChoiceCancel').onclick=()=>m.classList.add('hidden');m.classList.remove('hidden');
 },()=>renderGame());
}
function usePublicMarket(cardIndex){
 if(!isViewingOwnTurn())return;
 const owner=turn,c=installed[owner]?.[cardIndex];
 if(!c||c.special!=='publicmarket')return;
 if(normalCardActionUsed(publicMarketUsed,c))return alert('この交易場はこのターン使用済みです。');
 if(powers[turn].y<2)return alert('交易場の使用には資金2個が必要です。');
 let g=groups();if(!g.size)return alert('公開カードがありません。');
 let keys=[...g.keys()];
 let mraw=turnClockPrompt('獲得する公開カードの番号を入力してください。\n'+keys.map((k,i)=>(i+1)+': '+g.get(k)[0].name+' ×'+g.get(k).length).join('\n'));
 if(mraw===null)return;
 let mi=Number(mraw)-1;if(!Number.isInteger(mi)||mi<0||mi>=keys.length)return alert('正しい公開カード番号を入力してください。');
 let key=keys[mi],got=cardCommands.choice('market','all',{where:c=>c.key===key});
 // 獲得したカードも捨てる候補に含める。キャンセル時は資金・公開場・手札を変更しない。
 let candidates=[...hands[turn],...got];
 let hraw=turnClockPrompt('獲得後に捨てる手札の番号を入力してください。\n'+candidates.map((c,i)=>(i+1)+': '+c.name).join('\n'));
 if(hraw===null)return;
 let hi=Number(hraw)-1;if(!Number.isInteger(hi)||hi<0||hi>=candidates.length)return alert('正しい手札番号を入力してください。');
 if(turn!==owner||!isViewingOwnTurn()||!installed[owner].includes(c)||normalCardActionUsed(publicMarketUsed,c)||powers[owner].y<2)return;
 blockAllMarketUndo('交易場で公開場が変更されました。');
 powers[turn].y-=2;
 cardCommands.move(got,'market',{zone:'hand',owner:turn},{replaceSource:true});
 let out=cardCommands.choice('hand',1,{select:[hi]})[0];cardCommands.move(out,'hand','discard');
 addDialog('交易場：P'+(turn+1)+'が公開場から「'+got[0].name+'」'+(got.length>1?'×'+got.length:'')+'を獲得し、手札を1枚捨てました。');
 cardCommands.plus('market');
 cardCommands.once(1,'turn',{cardId:c.id,usage:publicMarketUsed,owner:turn,consume:true});
 renderGame();
}
function useScout(cardIndex){if(!isViewingOwnTurn())return alert('相手ターン中は使用できません。');if(!cardCommands.can(null,'hire-space'))return alert('雇用枠が上限です。');let c=installed[turn][cardIndex];if(!cardCommands.can(c,'installed')||!cardCommands.can(c,'special',{value:'scout'}))return;cardCommands.move(c,'installed','discard');let hired=cardCommands.koyou('gacha',1,{accept:e=>{if(sameUniqueAbilityAsLord(e)&&implementedCastPool(e.rarity).length&&turnClockConfirm(e.rarity+'「'+e.name+'」の固有能力は領主と同じです。\nこのキャストを雇用せず、同じレアリティでもう一度雇用しますか？'))e=redrawSameRarityCast(e)||e;employees[turn].push(e);hiredThisTurn=true;if(employeeUniqueAbilitiesEnabled(turn)&&e.hireBread){for(let i=0;i<e.hireBread;i++)drawBread(turn);}triggerNotices.push('スカウト：'+e.rarity+'「'+e.name+'」を雇用しました。');}});if(!hired.length)return alert('雇用できるキャストが実装されていません。');renderGame()}
// @kokoryo-end-section S0091

// @kokoryo-section S0094

function installPackCard(handIndex,choices=[]){
 let c=hands[turn][handIndex],spec=c?.installSpec;if(!c||!spec)return;
 if(typeof spec.resolve==='function'){let result=spec.resolve({handIndex,choices,card:c,owner:turn,api:packRuntimeApi(turn)});if(result===false)return;if(result==='handled'){renderGame();return}}
 let faces=spec.faces||[],anyNeed=typeof spec.any==='function'?Math.max(0,+spec.any({card:c,owner:turn,api:packRuntimeApi(turn)})||0):Math.max(0,+spec.any||0),needs=[...faces,...Array.from({length:anyNeed},()=>null)];
 let res=spec.resources||{},p=powers[turn];if(p.y<(res.y||0)||p.p<(res.p||0)||p.r<(res.r||0))return alert('設置に必要な資源が足りません。');
 if(choices.length!==needs.length||new Set(choices).size!==choices.length)return alert('異なるサイコロまたは命令書を選んでください。');
 // すべて検証してから消費する。命令書はインデックスの大きい順に消費する。
 for(let i=0;i<needs.length;i++){let choice=String(choices[i]),[kind,n]=choice.split(':'),face=needs[i];if(kind==='d'){let d=unusedDice().find(x=>x.id===+n);if(!d||face&&!face.includes(d.value))return alert('必要な出目を満たしていません。')}else if(kind==='b'){let b=breadHands[turn][+n];if(!b||face&&b.value!=='any'&&!face.includes(b.value))return alert('必要な命令書がありません。')}else if(!choice.startsWith('free:request:'))return alert('設置コストが不正です。')}
 let ordered=choices.map((v,i)=>({v,i})).sort((a,b)=>{let ai=String(a.v).startsWith('b:')?Number(String(a.v).split(':')[1]):-1,bi=String(b.v).startsWith('b:')?Number(String(b.v).split(':')[1]):-1;return bi-ai});
 for(const x of ordered){let face=needs[x.i],v=x.v;if(face){if(!face.some(n=>consumePackFaceCostDry(v,n)))return alert('設置コストの処理に失敗しました。')}else if(!consumeCostChoice(v))return alert('設置コストの処理に失敗しました。')}
 p.y-=res.y||0;p.p-=res.p||0;p.r-=res.r||0;let got=hands[turn].splice(handIndex,1)[0];registerInstallation(turn,got);renderGame()
}
function consumePackFaceCostDry(choice,required){let [kind,n]=String(choice).split(':');if(kind==='d'){let d=unusedDice().find(x=>x.id===+n&&x.value===required);if(!d)return false;d.used=true;return true}if(kind==='b'){let b=breadHands[turn][+n];if(!b||b.value!=='any'&&b.value!==required)return false;breadDiscard.push(breadHands[turn].splice(+n,1)[0]);recycleBreadIfEmpty();return true}return consumeCostChoice(choice,required)}
// @kokoryo-end-section S0094

// @kokoryo-section S0099

function installElekiter(handIndex,a,b){let p=powers[turn];if(p.y<1||p.r<1||p.p<1)return alert('設置には資金・兵力・食料のパワーが1個ずつ必要です。');if(!distinctCostChoices(a,b))return alert('異なる2枚/2個を選んでください。');if(!consumeCostChoice(a,2)||!consumeCostChoice(b,5))return alert('出目2と出目5を満たすサイコロまたは命令書を選んでください。');p.y--;p.r--;p.p--;registerInstallation(turn,hands[turn].splice(handIndex,1)[0]);renderGame()}
function installNanban(handIndex,a,b){let p=powers[turn];if(p.y<2||p.r<2||p.p<2)return alert('設置には資金・兵力・食料のパワーが2個ずつ必要です。');if(!distinctCostChoices(a,b))return alert('異なる2枚/2個を選んでください。');if(!consumeCostChoice(a)||!consumeCostChoice(b))return alert('使用するサイコロまたは命令書を2つ選んでください。');p.y-=2;p.r-=2;p.p-=2;registerInstallation(turn,hands[turn].splice(handIndex,1)[0]);renderGame()}
function installNinjaGuild(handIndex,a){let p=powers[turn];if(p.y<5)return alert('設置には資金5が必要です。');let ok=(String(a).startsWith('free:request:')&&lordInstallDiceDiscount()>Number(String(a).split(':')[2]))?true:(String(a).startsWith('d:')?(()=>{let d=unusedDice().find(x=>'d:'+x.id===a&&(x.value===1||x.value===2));if(!d)return false;d.used=true;return true})():(()=>{let i=+String(a).split(':')[1],b=breadHands[turn][i];if(!b||!(b.value==='any'||b.value===1||b.value===2))return false;breadDiscard.push(breadHands[turn].splice(i,1)[0]);recycleBreadIfEmpty();return true})());if(!ok)return alert('出目1または2を満たすサイコロまたは命令書を選んでください。');p.y-=5;registerInstallation(turn,hands[turn].splice(handIndex,1)[0]);renderGame()}
function installTenkuCat(handIndex,a,b,trashIndex){let p=powers[turn];if(p.y<2||p.r<1||p.p<2)return alert('設置には資金2・兵力1・食料2が必要です。');if(!distinctCostChoices(a,b))return alert('異なる2枚/2個を選んでください。');if(!installed[turn].length)return alert('天駆猫の設置には、正式に設置済みの他のマーケットカード1枚を捨て札にする必要があります。仮設置カードは選べません。');let idx=Number(trashIndex);if(!Number.isInteger(idx)||idx<0||idx>=installed[turn].length)return alert('捨て札にする設置済みカードを選んでください。');if(!consumeCostChoice(a,1)||!consumeCostChoice(b,6))return alert('出目1と出目6を満たすサイコロまたは命令書を選んでください。');p.y-=2;p.r-=1;p.p-=2;discard.push(installed[turn].splice(idx,1)[0]);registerInstallation(turn,hands[turn].splice(handIndex,1)[0]);renderGame()}
function installCursedClock(handIndex,a){let p=powers[turn];if(p.p<3)return alert('設置には食料が3個必要です。');let ok=(String(a).startsWith('free:request:')&&lordInstallDiceDiscount()>Number(String(a).split(':')[2]))?true:(String(a).startsWith('d:')?(()=>{let d=unusedDice().find(x=>'d:'+x.id===a&&(x.value===5||x.value===6));if(!d)return false;d.used=true;return true})():(()=>{let i=+String(a).split(':')[1],b=breadHands[turn][i];if(!b||!(b.value==='any'||b.value===5||b.value===6))return false;breadDiscard.push(breadHands[turn].splice(i,1)[0]);recycleBreadIfEmpty();return true})());if(!ok)return alert('出目5または6を満たすサイコロまたは命令書を選んでください。');p.p-=3;let c=hands[turn].splice(handIndex,1)[0];registerInstallation(turn,c);renderGame()}

function installTreasureShip(handIndex,color){let p=powers[turn];if(!['y','r','p'].includes(color)||p[color]<30)return alert('選んだ1色のパワーが30個必要です。');p[color]-=30;let c=hands[turn].splice(handIndex,1)[0];registerInstallation(turn,c);renderGame()}
function installInadamashii(handIndex){if(installed[turn].length<8)return alert('正式に設置済みのマーケットカードが8枚必要です。');let names=installed[turn].map((c,i)=>(i+1)+': '+c.name).join('\n');let raw=turnClockPrompt('捨てる設置済みカード8枚の番号をカンマ区切りで入力してください。\n'+names);if(raw===null)return;let idx=[...new Set(raw.split(',').map(x=>Number(x.trim())-1))];if(idx.length!==8||idx.some(i=>!Number.isInteger(i)||i<0||i>=installed[turn].length))return alert('異なる8枚の番号を正しく入力してください。');idx.sort((a,b)=>b-a).forEach(i=>discard.push(installed[turn].splice(i,1)[0]));let c=hands[turn].splice(handIndex,1)[0];registerInstallation(turn,c);renderGame()}
function resolveOnInstall(c,owner){
 if(c.special==='lordmeeting')resolveLordMeetingInstall(owner);
 runPackCardHook(c,'onInstall',{owner});
 if(c.special==='massRecruitment'){for(let p=0;p<playerCount;p++){let e=gachaCast();if(e){let old=turn;turn=p;finalizeHire(e,'一斉採用：');turn=old;hiredThisTurn=false;}}let n=playerCount===2?1:playerCount===3?2:3;for(let i=0;i<n;i++)drawBread(owner);}
 else if(c.special==='castLevelUp'){let staff=employees[owner]||[];if(staff.length){let msg=staff.map((e,i)=>(i+1)+'. '+castDisplayName(e)+' ['+e.rarity+']').join('\n');let i=Math.floor(+(turnClockPrompt('レベルアップする雇用キャラクター\n'+msg,'1')||0))-1;if(i>=0&&staff[i]){let ne=oneStepUpgradeCast(staff[i],{allowUR:false});if(ne)staff[i]=applyUniqueAbilityDef(ne);}}}
 else if(c.special==='guaranteedUR'){let old=hands[owner];let e=packCastPool('UR')[Math.floor(Math.random()*packCastPool('UR').length)];if(e){let before=turn;turn=owner;finalizeHire({...e},'確定ガチャ：');turn=before;hiredThisTurn=false;}}
 else if(c.special==='amicableRetirement'){let staff=employees[owner]||[];if(staff.length){let msg=staff.map((e,i)=>(i+1)+'. '+castDisplayName(e)+' ['+e.rarity+']').join('\n');let i=Math.floor(+(turnClockPrompt('解雇する雇用キャラクター\n'+msg,'1')||0))-1;if(i>=0&&staff[i]){nextHireMinRarity=upgradeRarity(staff[i].rarity);staff.splice(i,1);}}}
 else if(c.special==='honeyTrap'){let targets=[];for(let p=0;p<playerCount;p++)if(p!==owner)(employees[p]||[]).forEach((e,i)=>targets.push({p,i,e}));if(targets.length){let n=Math.floor(+(turnClockPrompt('《ハニートラップ》：解雇する相手の雇用キャラクター番号\n'+targets.map((x,i)=>(i+1)+'. P'+(x.p+1)+' '+castDisplayName(x.e)).join('\n'),'1')||0));if(n&&targets[n-1])employees[targets[n-1].p].splice(targets[n-1].i,1)}}
 else if(c.special==='employeeTrade'){let p=+turnClockPrompt('《トレード》：交換相手のP番号','2')-1;if(p>=0&&p<playerCount&&p!==owner&&(employees[owner]||[]).length&&(employees[p]||[]).length){let a=Math.floor(+(turnClockPrompt('自分の雇用キャラクター番号\n'+employees[owner].map((e,i)=>(i+1)+'. '+castDisplayName(e)).join('\n'),'1')||0))-1;let b=Math.floor(+(turnClockPrompt('相手の雇用キャラクター番号\n'+employees[p].map((e,i)=>(i+1)+'. '+castDisplayName(e)).join('\n'),'1')||0))-1;if(employees[owner][a]&&employees[p][b]){let t=employees[owner][a];employees[owner][a]=employees[p][b];employees[p][b]=t}}}
 else if(c.special==='surpriseSpecialGacha'){let pool=['N','R','SR','SSR'].flatMap(r=>packCastPool(r));if(pool.length){let msg=pool.map((e,i)=>(i+1)+'. '+e.rarity+' '+castDisplayName(e)).join('\n');let n=Math.floor(+(turnClockPrompt('《サプライズスペシャルガチャ》\n雇用するキャラクター\n'+msg,'1')||0));if(n&&pool[n-1])finalizeHire({...pool[n-1]},'サプライズスペシャルガチャ：')}}
 else if(c.special==='specialProcurement'){for(let p=0;p<playerCount;p++){let n=p===owner?15:5;let k=turnClockPrompt('《特需》：P'+(p+1)+'が獲得する資源\n資金/食料/兵力の個数を「資金,食料,兵力」で入力（合計'+n+'）',''+n+',0,0');if(k){let a=k.split(',').map(Number);if(a.length===3&&a.reduce((x,y)=>x+y,0)===n){powers[p].y+=a[0];powers[p].p+=a[1];powers[p].r+=a[2]}}}}
 else if(c.special==='cursedclock'){gainResource(owner,'y',3,'effect');gainResource(owner,'r',3,'effect');gainResource(owner,'p',3,'effect');alert('呪怨の懐中時計の設置時効果：資金・兵力・食料を3個ずつ獲得しました。');}
 else if(c.special==='paneteria'){blockAllMarketUndo('ナーロッパランドで市場が変更されました。');cardCommands.change('market','all');pendingParkTaken=[];pendingParkPlayers=parkSelectionOrder(owner);addDialog('ナーロッパランド：公開カードを置き直しました。P'+(owner+1)+'から順に1種類ずつ選びます。');}
 else if(c.special==='blackcasino'){let drawn=cardCommands.toba({owner});if(drawn){alert('開拓ラッシュ：山札の上から「'+drawn.name+'」を仮設置しました。')}else alert('開拓ラッシュ：設置できる山札がありません。');}
}
function installPaneteria(handIndex,a){if(!consumeCostChoice(a))return alert('使用するサイコロまたは命令書を選んでください。');let c=hands[turn].splice(handIndex,1)[0];registerInstallation(turn,c);renderGame()}
function resolveLordMeetingInstall(owner){const distributed=distributeLimitedByQuota(owner,'all',p=>p===owner?3:1,(p,n)=>{let got=0;for(let i=0;i<n;i++){if(!cardCommands.draw('command',1,{owner:p}).count)break;got++}return got});for(const result of distributed){if(result.received)triggerNotices.push('領主会議：P'+(result.player+1)+'が命令書を'+result.received+'枚獲得しました。')}}
function installLordMeeting(handIndex,a){let p=powers[turn];if(p.y<4)return alert('設置には資金4が必要です。');if(!consumeCostChoice(a,1)&&!consumeCostChoice(a,6))return alert('出目1または6を満たすサイコロまたは命令書を選んでください。');p.y-=4;let c=hands[turn].splice(handIndex,1)[0];registerInstallation(turn,c);renderGame()}
function installBlackCasino(handIndex,a,b){let p=powers[turn];if(p.p<5)return alert('設置には食料5が必要です。');if(!distinctCostChoices(a,b))return alert('異なる2枚/2個を選んでください。');if(!consumeCostChoice(a,2)||!consumeCostChoice(b,5))return alert('出目2と出目5を満たすサイコロまたは命令書を選んでください。');p.p-=5;let c=hands[turn].splice(handIndex,1)[0];registerInstallation(turn,c);renderGame()}
function installGreaterAcquisition(handIndex,special,a,b,mode){let c=hands[turn][handIndex],p=powers[turn];if(!c||c.special!==special)return;let cfg={greatermine:{a:1,b:2,res:'y',amt:5,base:'mine',baseName:'鉱山'},greaterfarm:{a:3,b:4,res:'p',amt:5,base:'farm',baseName:'農場'},greaterbarracks:{a:5,b:6,res:'r',amt:5,base:'barracks',baseName:'兵舎'},greatercommand:{a:3,b:4,res2:true,base:'commandroom',baseName:'司令室'}}[special];if(!cfg)return;if(cfg.res2){if(p.y<4||p.r<2)return alert('設置には資金4・兵力2が必要です。')}else if(p[cfg.res]<cfg.amt)return alert('設置に必要な資源が足りません。');if(String(mode).startsWith('up:')){let idx=+String(mode).split(':')[1],base=installed[turn][idx];if(!cardCommands.can(base,'installed')||!cardCommands.can(base,'special',{value:cfg.base}))return alert('アップグレード元の'+cfg.baseName+'を選んでください。');cardCommands.move(base,'installed','discard');}else{if(!distinctCostChoices(a,b))return alert('異なる2枚/2個を選んでください。');if(!consumeCostChoice(a,cfg.a)||!consumeCostChoice(b,cfg.b))return alert('必要な2つの出目を満たすサイコロまたは命令書を選んでください。');}if(cfg.res2){p.y-=4;p.r-=2}else p[cfg.res]-=cfg.amt;let got=hands[turn].splice(handIndex,1)[0];registerInstallation(turn,got);renderGame()}

// 設置者から開始し、次の手番へ順番に全員が1回ずつ選択する。
function parkSelectionOrder(owner){return cardCommands.start(owner,'all')}
function resumeDeferredInstall(){if(!pendingParkPlayers.length&&turnClockChoice?.kind==='genesis'&&turnClockChoice.waiting==='park'){const c=turnClockChoice;turnClockChoice=null;resolveEggHarp(c.owner,c.n)}}
function finishEmptyParkChoices(){
 // 山札・公開場が尽きた場合は、残りのプレイヤーが選択できずに停止しないよう処理する。
 if(!pendingParkPlayers.length||groups().size)return;
 while(pendingParkPlayers.length){
  let p=pendingParkPlayers.shift();
  addDialog('ナーロッパランド：P'+(p+1)+'は公開カードがないため選択を終了しました。');
 }
 resumeDeferredInstall();
}
function applyOnlineParkPick(p,key){
 if(!pendingParkPlayers.length||pendingParkPlayers[0]!==p)return false;
 let got=cardCommands.choice('market','all',{where:c=>c.key===key});if(!got.length)return false;
 cardCommands.move(got,'market',{zone:'hand',owner:p},{replaceSource:true});
 pendingParkTaken.push({player:p,name:got[0].name,count:got.length});
 addDialog('ナーロッパランド：P'+(p+1)+'が公開場から「'+got[0].name+'」'+(got.length>1?'×'+got.length:'')+'を獲得しました。');
 cardCommands.start(p,1,{queue:pendingParkPlayers,step:()=>true});resumeDeferredInstall();renderGame();return true;
}
// @kokoryo-end-section S0099

// @kokoryo-section S0101

function useElekiter(id){if(elekiterUsed[turn])return alert('エレキテル研究所はターン中1回だけ使用できます。');let d=useDie(id);if(!d)return alert('使用できるサイコロがありません。');powers[turn].y++;powers[turn].r++;powers[turn].p++;let got=drawBread(turn);if(got)triggerNotices.push('エレキテル研究所：命令書「'+breadLabel(got)+'」を1枚獲得しました。');else triggerNotices.push('エレキテル研究所：命令書山札・捨て札がないため獲得できませんでした。');elekiterUsed[turn]=true;renderGame()}
// @kokoryo-end-section S0101

// @kokoryo-section S0113

function debtFinalVPPerCard(p){let vals=specialOwners(cfg=>typeof cfg.debt?.finalVPPerDebt==='number').map(x=>x.cfg.debt.finalVPPerDebt),base=vals.length?vals[vals.length-1]:-1;if(depressionDebtLocked(p))return 0;if(hasEraSpecial(p,'skyscraper')&&base<0)return Math.abs(base);return base}
function debtRepayMultiplier(){let vals=specialOwners(cfg=>+cfg.debt?.repayMultiplier>0).map(x=>+x.cfg.debt.repayMultiplier);return vals.length?Math.max(...vals):1}
// @kokoryo-end-section S0113
