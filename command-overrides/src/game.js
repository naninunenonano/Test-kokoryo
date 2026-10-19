// Editing source only. Build with npm run build; do not load this file directly.
// Section order and the shared private scope are preserved by src/order.json.

// @kokoryo-section S0001

const q=s=>document.querySelector(s), mk=(pre,label,n)=>Array.from({length:n},(_,i)=>({key:pre+(i+1),name:label+(i+1),type:pre})), copies=a=>a.flatMap(c=>Array.from({length:6},(_,i)=>({...c,id:c.key+'-'+(i+1)})));
// @kokoryo-end-section S0001

// @kokoryo-section S0018

const DEFAULT_RULE_SETTINGS=Object.freeze({winVP:30,marketTypes:12,initialResources:10,hireLimit:5,legendSlots:5});
const INITIAL_DRAFT=Object.freeze({packSize:8,picks:5});
function ruleSettingValue(key,value){
 const n=value===null||value===undefined||String(value).trim()===''?NaN:Number(value);
 return Math.max(key==='initialResources'||key==='hireLimit'?0:1,Number.isFinite(n)?Math.floor(n):DEFAULT_RULE_SETTINGS[key]);
}
function initialDraftSetupError(count){
 const needed=count*INITIAL_DRAFT.packSize;
 return STD.length<needed?'初期ドラフトのSカードが不足しています。'+count+'人に各'+INITIAL_DRAFT.packSize+'枚を提示するには'+needed+'枚必要ですが、現在は'+STD.length+'枚です。デッキ増量後に対応します。':'';
}
function createInitialDraftDeal(count){
 const error=initialDraftSetupError(count);if(error)throw new RangeError(error);
 const supply=sh(STD),packs=Array.from({length:count},()=>supply.splice(0,INITIAL_DRAFT.packSize));return {packs,unused:supply};
}
let gameSettings={...DEFAULT_RULE_SETTINGS,handLimit:10,deckId:'standard1',randomizerEnabled:false,randomizerCount:15,enabledPacks:[],enabledRulePacks:[],ruleCardMode:'select',ruleCardChoice:'RC1',activeRuleCards:[]};
function legendSlotMax(deckId=gameSettings.deckId){let cfg=activeDeckConfig(deckId),lower=(cfg.lowerLegendKeys||[]).length,upper=(cfg.upperLegendKeys||[]).length;return Math.max(1,Math.min(6,lower,upper))}
function fillLegendSlotSelect(sel,deckId,value){let el=typeof sel==='string'?q(sel):sel;if(!el)return;let max=legendSlotMax(deckId);el.innerHTML='';let cur=Math.max(1,Math.min(max,+value||Math.min(DEFAULT_RULE_SETTINGS.legendSlots,max)));for(let i=1;i<=max;i++){let o=document.createElement('option');o.value=i;o.textContent=i+'枚';el.appendChild(o)}el.value=cur}
function refreshLegendSlotSelectors(){fillLegendSlotSelect('#settingLegendSlots',q('#deckPreset')?.value||'standard1',gameSettings.legendSlots);fillLegendSlotSelect('#onlineDebugRuleLegendSlots',gameSettings.deckId,gameSettings.legendSlots);fillLegendSlotSelect('#realRuleLegendSlots',realOnlineDeckId||'standard1',realOnlineRules?.legendSlots||gameSettings.legendSlots)}
let selectedMarketKey=null;
// Ver.2.16: current-turn normal market acquisition undo history. Each acquired pile is tracked independently.
let marketUndoHistory=[];
let commandUndoHistory=[];
function clearMarketUndo(){marketUndoHistory=[];commandUndoHistory=[]}
function marketUndoEntryAvailable(e){return !botMatchMode&&(!(onlineDebugMode||realOnlineMainMode)||viewer===turn)&&!!e&&!e.blocked&&e.owner===turn&&e.cards.length>0&&e.cards.every(c=>hands[turn].includes(c))}
function blockAllMarketUndo(reason=''){
 marketUndoHistory.forEach(e=>e.blocked=true);
 commandUndoHistory.forEach(e=>e.blocked=true);
}
function addCommandUndo(entry){commandUndoHistory.push({id:Date.now()+Math.random(),owner:turn,blocked:false,...entry})}
function commandUndoAvailable(e){return !!e&&!e.blocked&&e.owner===turn}
function undoCommandAction(id){
 let e=commandUndoHistory.find(x=>x.id===id);if(!commandUndoAvailable(e))return alert('この操作は戻せません。市場が変更されたか、すでに戻しています。');
 if(e.kind==='dieConvert'){let d=dice.find(x=>x.id===e.dieId);if(!d||!d.used||powers[turn][e.color]<(e.amount??1))return alert('現在の状態ではこの変換を戻せません。');powers[turn][e.color]-=(e.amount??1);d.used=false}
 else if(e.kind==='breadConvert'){if(powers[turn][e.color]<(e.amount??2))return alert('現在の状態ではこの変換を戻せません。');let loc=breadDiscard.findIndex(x=>x.id===e.order.id);if(loc>=0)breadDiscard.splice(loc,1);else{loc=breadDeck.findIndex(x=>x.id===e.order.id);if(loc>=0)breadDeck.splice(loc,1);else return alert('変換した命令書がすでに別の処理で移動しているため戻せません。')}powers[turn][e.color]-=(e.amount??2);breadHands[turn].push(e.order)}
 else if(e.kind==='resourceExchange'){if(powers[turn][e.to]<(e.gain??1))return alert('受け取った資源をすでに使っているため、この交換は戻せません。');powers[turn][e.to]-=(e.gain??1);powers[turn][e.from]+=(e.amount||2)}
 e.blocked=true;pendingBreadAnyIndex=null;pendingResourceFrom=null;renderGame();
}
// @kokoryo-end-section S0018

// @kokoryo-section S0020

function undoMarketAcquisition(id){let e=marketUndoHistory.find(x=>x.id===id);if(!marketUndoEntryAvailable(e))return alert('この市場獲得は戻せません。獲得した山のカードを設置・移動したか、市場を変更する効果を使用しています。');for(let c of e.cards){let i=hands[turn].indexOf(c);if(i<0)return alert('獲得したカードが手札に揃っていないため戻せません。');hands[turn].splice(i,1)}market.push(...e.cards);let d=dice.find(x=>x.id===e.dieId);if(d)d.used=false;e.blocked=true;selectedMarketKey=null;renderGame()}
let installEffectStack=[],installEffectRunning=false,parkChoiceRevision=0;
let playerTurnCounts=[],lastCountedTurnToken=-1,oracleUpgradesThisTurn=[];
let nightEscapePostAvailable=false,nightEscapeResetNext=[],stdAbilityUsed={},pendingLordResource=0,playerCount=4,lordOracleUsed=[],lordTributeUsed=[],unusedStd=[],packs=[],hands=[],selected=[],round=0,viewer=0,deck=[],market=[],discard=[],turn=0,dice=[],powers=[],installed=[],temporary=[],elekiterUsed=[],pendingNanban=0,pendingTenkuCat=0,commandCounts=[],komePlace=100,pendingParkPlayers=[],pendingParkTaken=[],characterMode='P1',characters=[],legends=[],legendTakenThisTurn=false,endgameStarter=null,endgameRemaining=0,gameEnded=false,breadDeck=[],breadDiscard=[],breadHands=[],employeeDeck=[],employees=[],hiredThisTurn=false,pendingSSRBonus=0,pendingCastResourceChoices=[],lordFirstBreadUsed=[],lordOverclockUsed=[],pendingOverclockChoices=[],debugVP=[],copiedAbility=null,copiedOracleUsed=false,copiedTributeUsed=false,organizationUsed=[];
function sh(a){a=[...a];for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function makeBreadDeck(){let a=[];for(let v=1;v<=6;v++)for(let i=0;i<8;i++)a.push({kind:'bread',value:v,name:'命令書 '+v,id:'B'+v+'-'+(i+1)});for(let i=0;i<2;i++)a.push({kind:'bread',value:'any',name:'命令書 ANY',id:'BANY-'+(i+1)});return sh(a)}
function recycleBreadIfEmpty(){if(!breadDeck.length&&breadDiscard.length){breadDeck=sh(breadDiscard);breadDiscard=[]}}
function drawBread(owner=turn){recycleBreadIfEmpty();let c=breadDeck.shift()||null;if(c){breadHands[owner].push(c);recycleBreadIfEmpty()}return c}
function breadLabel(b){return b.value==='any'?'ANY':String(b.value)}
// @kokoryo-end-section S0020

// @kokoryo-section S0022

function handLimitNeedsDiscard(p){return totalHandCount(p)>handLimit(p)&&(!depressionProtectsDebtAtHandLimit()||hands[p].length+breadHands[p].length>0)}
// @kokoryo-end-section S0022

// @kokoryo-section S0024

function totalHandCount(p){return hands[p].length+breadHands[p].length+(debtIgnoredForHand(p)?0:(commandCounts[p]||0))}
// @kokoryo-end-section S0024

// @kokoryo-section S0026

function gainResource(p,key,n=1,source='effect'){
 n=Math.max(0,Math.floor(+n||0));if(!n||!powers[p]||!['y','p','r'].includes(key))return 0;
 if((depressionStartSuppressed&&p===turn&&!hasEquivalentExchange(p))||!eraGainAllowed(p,key,source))return 0;powers[p][key]+=n;return n
}
// Shared card commands do not render, consume an activation, or broadcast state.
function commandQuantity(value){
 const n=Number(value);if(!Number.isSafeInteger(n)||n<0)throw new RangeError('Invalid command quantity');return n
}
function commandPool(resource,quantity,{owner=turn,source='effect',respectRestrictions=true}={}){
 if(!['y','p','r'].includes(resource))throw new RangeError('Unknown resource');
 const n=commandQuantity(quantity);if(!powers[owner])return 0;
 if(respectRestrictions)return gainResource(owner,resource,n,source);
 // Preserve the original direct additions in the standard turn-start phase.
 powers[owner][resource]+=n;return n
}
function commandDraw(target,quantity,{owner=turn}={}){
 const n=commandQuantity(quantity);if(!['deck','debt','command'].includes(target))throw new RangeError('Unknown draw target');
 if(target==='debt')return {count:acquireDebt(owner,n),cards:[]};
 const cards=[];for(let i=0;i<n;i++){
  const c=target==='deck'?drawOne():drawBread(owner);
  if(c){if(target==='deck')hands[owner].push(c);cards.push(c)}
 }
 return {count:cards.length,cards}
}
function commandDice(operation,{count=1,dieId,value,delta=0,source='effect'}={}){
 if(!['roll','gain','reroll','adjust','set','choose'].includes(operation))throw new RangeError('Unknown dice operation');
 const n=commandQuantity(count);
 if(['gain','set','choose'].includes(operation)&&(!Number.isInteger(value)||value<1||value>6))throw new RangeError('Invalid die face');
 if(operation==='adjust'&&!Number.isSafeInteger(delta))throw new RangeError('Invalid die adjustment');
 if(operation==='roll'||operation==='gain'){
  const added=[];let id=Math.max(0,...dice.map(d=>d.id));
  for(let i=0;i<n;i++){const d={id:++id,value:operation==='roll'?1+Math.floor(Math.random()*6):value,used:false,source};dice.push(d);added.push(d)}
  return added
 }
 const d=dice.find(x=>x.id===+dieId&&!x.used);if(!d)return [];
 if(operation==='reroll'){d.value=1+Math.floor(Math.random()*6);resolveReactiveRolls([d],false)}
 else if(operation==='adjust')d.value=Math.max(1,Math.min(6,d.value+delta));
 else d.value=value;
 return [d]
}
function commandLimit(target,delta,{base=target==='hire'?gameSettings.hireLimit:gameSettings.handLimit,count=1}={}){
 if(!['hand','hire'].includes(target))throw new RangeError('Unknown limit target');if(!Number.isSafeInteger(delta)||!Number.isSafeInteger(base))throw new RangeError('Invalid limit');return base+delta*commandQuantity(count)
}
// Commands use explicit zones, stateless event descriptors, and existing saved ledgers.
function commandZone(target,owner=turn){
 if(Array.isArray(target))return target;
 const zone=typeof target==='string'?target:target?.zone,p=typeof target==='object'&&!Array.isArray(target)?target.owner??owner:owner;
 const list=({hand:hands[p],installed:installed[p],temporary:temporary[p],market,discard,deck,employees:employees[p],bread:breadHands[p],breadDiscard})[zone];
 if(!Array.isArray(list))throw new RangeError('Unknown card zone');return list
}
function commandChoice(target,quantity,{owner=turn,where=()=>true,select=null}={}){
 const candidates=commandZone(target,owner).filter(where),n=quantity==='all'?candidates.length:commandQuantity(quantity);
 const chosen=select===null?candidates.slice(0,n):select.map(i=>typeof i==='number'?candidates[i]:i);
 if(chosen.length>n||new Set(chosen).size!==chosen.length||chosen.some(c=>!candidates.includes(c)))throw new RangeError('Invalid card selection');
 return chosen.slice()
}
function commandMove(cards,from,to,{replaceSource=false,index=null}={}){
 const chosen=Array.isArray(cards)?cards.slice():[cards],source=commandZone(from),destination=commandZone(to);
 if(source===destination)throw new RangeError('Move requires different zones');
 if(new Set(chosen).size!==chosen.length||chosen.some(c=>!source.includes(c)))throw new RangeError('Card not in explicit source');
 for(let p=0;p<playerCount;p++)if((destination===installed[p]||destination===temporary[p])&&source!==installed[p]&&source!==temporary[p]&&chosen.some(isLegendCard)&&!legendAcquisitionAllowed(p))return [];
 if(replaceSource){
  if(from!=='market'&&from?.zone!=='market')throw new RangeError('Replacement source must be market');
  market=source.filter(c=>!chosen.includes(c));
 }else for(const c of chosen)source.splice(source.indexOf(c),1);
 if(index===null)destination.push(...chosen);else destination.splice(index,0,...chosen);return chosen
}
function commandStart(owner,quantity='all',{queue=null,step=null}={}){
 const n=quantity==='all'?playerCount:commandQuantity(quantity);
 if(!Number.isInteger(owner)||owner<0||owner>=playerCount||n>playerCount)throw new RangeError('Invalid player order');
 if(queue){
  if(!n||!step||!queue.length||queue[0]!==owner)return false;
  // One committed choice per call; the existing synchronized queue owns the wait.
  if(step(owner)===false)return false;queue.shift();return true
 }
 const order=Array.from({length:n},(_,i)=>(owner+i)%playerCount);
 if(!step)return order;
 for(const p of order)if(step(p)===false)break;
 return order
}
function commandPlus(target,quantity='max'){
 if(target!=='market')throw new RangeError('Unknown refill target');
 if(quantity==='max'){refillMarket();return market}
 const limit=commandQuantity(quantity),keys=new Set(market.map(c=>c.key));
 while(keys.size<limit){const c=drawOne();if(!c)break;market.push(c);keys.add(c.key)}return market
}
function commandChange(target,quantity='all',options={}){
 if(quantity&&typeof quantity==='object'&&!Array.isArray(quantity)){options=quantity;quantity='all'}
 target=({'資源変換':'convert','資源交換':'exchange','公開場':'market'})[target]||target;
 const {owner=turn,kind='die',dieId,index,color,from,to,undo=false,record=false,source=target==='exchange'?'exchange':'dieConvert'}=options;
 if(target==='market'){
  const cost=options.cost||{};if(!canPayResourceCost(cost,owner))return false;
  const cards=Array.isArray(quantity)?commandChoice('market','all',{select:quantity}):commandChoice('market',quantity);
  payResourceCost(cost,owner);
  commandMove(cards,'market','discard',{replaceSource:true});commandPlus('market');return cards
 }
 if(target==='convert'){
  if(owner!==turn)throw new Error('Conversion requires active player');
  const die=kind==='die'?dice.find(d=>d.id===+dieId&&!d.used):null,order=kind==='command'?breadHands[owner]?.[index]:null;
  if(!die&&!order)return {ok:false,amount:0};const face=die?die.value:order.value;
  const key=color||(face==='any'?null:colorFor(face));if(!['y','p','r'].includes(key))return {ok:false,amount:0};
  if(die&&key!==colorFor(face)&&!hasGodBlessingForTurn()&&!options.allowAny)return {ok:false,amount:0};
  if(order&&face!=='any'&&key!==colorFor(face)&&!options.allowAny)return {ok:false,amount:0};
  const amount=(die?(quantity==='all'?3:commandQuantity(quantity)):2)+(die?conversionBonus(owner):0);
  if(die)die.used=true;else{breadDiscard.push(breadHands[owner].splice(index,1)[0]);recycleBreadIfEmpty()}
  const gained=gainResource(owner,key,amount,source);
  if(record)playLogAction('resource_conversion',{method:die?'die':'command',dieValue:die?.value,dieId:die?.id,order:order?.value,to:key,gained});
  if(undo)addCommandUndo(die?{kind:'dieConvert',dieId:die.id,dieValue:face,color:key,amount:gained}:{kind:'breadConvert',order,color:key,amount:gained});
  return {ok:true,amount:gained,color:key,die,order}
 }
 if(target==='exchange'){
  if(!['y','p','r'].includes(from)||!['y','p','r'].includes(to)||from===to)return {ok:false,amount:0};
  const rate=options.rate??exchangeRateFor(owner),gain=options.gain??1;commandQuantity(rate);commandQuantity(gain);
  if(powers[owner][from]<rate)return {ok:false,amount:0};powers[owner][from]-=rate;const received=gainResource(owner,to,gain,source);
  if(!received&&options.rollbackBlocked)powers[owner][from]+=rate;
  if(record)playLogAction('resource_exchange',{from,to,spent:rate,gained:received});
  if(undo)addCommandUndo({kind:'resourceExchange',from,to,amount:rate,gain:received});return {ok:true,amount:received,spent:rate}
 }
 throw new RangeError('Unknown change target')
}
function commandCan(target,condition,{owner=turn,value}={}){
 if(typeof condition==='function')return !!condition(target);
 if(condition==='installed')return (installed[owner]||[]).includes(target);
 if(condition==='temporary')return (temporary[owner]||[]).includes(target);
 if(condition==='special')return !!target&&target.special===value;
 if(condition==='hire-space')return (employees[owner]||[]).length<effectiveHireLimit(owner);
 throw new RangeError('Unknown condition')
}
function commandCount(target,condition=()=>true,{owner=turn}={}){
 if(target==='players')return Array.from({length:playerCount},(_,p)=>p).filter(condition).length;
 if(target==='resources')return Object.entries(powers[owner]||{}).filter(([k,n])=>condition(n,k)).reduce((sum,[,n])=>sum+n,0);
 return commandZone(target,owner).filter(condition).length
}
function commandTrigger(event,context,{event:expected=event,targets,when=()=>true,instances=()=>1,match=()=>true,aggregate=false,effect}={}){
 if(event!==expected)return [];
 const hits=context.items?context.items.filter(match).length:1,results=[];if(!hits)return results;
 for(const owner of targets||Array.from({length:playerCount},(_,i)=>i)){
  if(!when(owner,context))continue;const count=commandQuantity(instances(owner,context));if(!count)continue;
  const hit={...context,owner,hits,count,occurrences:hits*count};
  if(aggregate)results.push(effect(hit));
  else for(let i=0;i<hits*count;i++)results.push(effect({...hit,hits:1,count:1,occurrences:1,index:i}));
 }
 return results
}
function commandHire(mode,quantity,options={},fusionOptions={}){
 if(mode==='レベルアップ'||mode==='levelup')return commandEvolve('レベルアップ',quantity,options);
 if(mode==='融合'||mode==='fusion')return commandEvolve('融合',options,{...fusionOptions,kind:quantity});
 const {accept=e=>finalizeHire(e),canHire=()=>cardCommands.can(null,'hire-space'),selected=null,pool=null}=options;
 if(!['gacha','select'].includes(mode))throw new RangeError('Unknown hiring mode');const n=commandQuantity(quantity),hired=[];
 const candidates=mode==='select'?(pool||['N','R','SR','SSR','UR'].flatMap(r=>implementedCastPool(r))):null;
 for(let i=0;i<n;i++){if(!canHire())break;let e=mode==='gacha'?gachaCast():selected?.[i];if(!e||mode==='select'&&!candidates.some(c=>c.id===e.id))break;if(mode==='select')e={...e};accept(e);notifyStaffingAgency(turn);hired.push(e)}return hired
}
function commandToba({owner=turn,card=null,from=null,created=false}={}){
 if(isLegendCard(card||deck[0])&&!legendAcquisitionAllowed(owner))return null;
 if(!card){card=drawOne();if(!card)return null}else if(!created&&(!from||!commandZone(from).includes(card)))return null;
 if(from){const arr=commandZone(from);arr.splice(arr.indexOf(card),1)}registerInstallation(owner,card);return card
}
function commandInstanceId(card){
 if(!card||typeof card!=='object')throw new TypeError('Missing effect instance');if(card.id!=null)return card.id;if(card._commandId)return card._commandId;
 const used=new Set([...installed.flat(),...temporary.flat(),...hands.flat(),...employees.flat(),...discard,...deck,...market].map(c=>c?._commandId));let n=1;while(used.has('instance:'+n))n++;return card._commandId='instance:'+n
}
function commandOnce(limit,period,{cardId,usage,owner=null,consume=false}={}){
 const max=commandQuantity(limit);if(!['turn','game'].includes(period))throw new RangeError('Unknown usage period');
 if(!usage||cardId===undefined||cardId===null)throw new RangeError('Missing usage ledger or card ID');
 if(owner!==null&&usage[owner]===true)return false;
 const ledger=owner===null?usage:usage[owner],raw=ledger?.[cardId],used=raw===true?1:Number(raw)||0;
 if(used>=max)return false;
 if(consume){const store=owner===null?usage:(usage[owner]||={});store[cardId]=max===1?true:used+1}return true
}
function commandBoost(base,amount,{count=1,stack='add'}={}){const values=Array.isArray(amount)?amount:[amount];if(!values.every(Number.isFinite)||!Number.isFinite(base))throw new RangeError('Invalid boost');return base+(stack==='max'?Math.max(0,...values):values.reduce((a,b)=>a+b,0))*commandQuantity(count)}
function commandFunction(expression,context={}){
 if(typeof expression==='function')return expression(context);
 const {target='installed',owner=turn,where=()=>true,value=()=>1,multiplier=1,flat=0,divisor=1,round='none'}=expression||{};
 let result=commandZone(target,owner).filter(where).reduce((n,c)=>n+value(c),0)*multiplier/divisor+flat;
 return round==='floor'?Math.floor(result):round==='ceil'?Math.ceil(result):result
}
function commandRemove(target='all',{owner=turn,quantity='all'}={}){
 const keys=target==='all'?['y','p','r']:Array.isArray(target)?target:[target];if(keys.some(k=>!['y','p','r'].includes(k)))throw new RangeError('Unknown resource');
 const n=quantity==='all'?null:commandQuantity(quantity),removed={};for(const k of keys){removed[k]=n===null?powers[owner][k]:Math.min(n,powers[owner][k]);powers[owner][k]-=removed[k]}return removed
}
function commandDiscount(target,kind,amount,{sources=[],remaining=null}={}){
 if(target!=='install'||kind!=='dice')throw new RangeError('Unknown discount');
 const value=commandQuantity(amount)+sources.reduce((n,x)=>n+commandQuantity(x),0);return remaining===null?value:Math.max(0,commandQuantity(remaining)-value)
}
function commandRepeat(times,{index=0,step,done=()=>{}}={}){
 const n=commandQuantity(times),i=commandQuantity(index);if(i>=n)return done();if(typeof step!=='function')throw new TypeError('Missing repeat body');
 let continued=false;return step(i,()=>{if(continued)return;continued=true;return commandRepeat(n,{index:i+1,step,done})})
}
function commandCopy(name,{applyStart=false}={}){
 const def=UNIQUE_ABILITY_DEFS[name];if(!def||def.copyable===false||def.props?.uncopyable)return false;
 const profile={...abilityProfile(name)};delete profile.firstBreadBonus;delete profile.overclockResources;copiedAbility=name;
 if(applyStart){if(profile.turnBread)commandDraw('command',profile.turnBread);if(profile.invisibleHand)commandDraw('deck',profile.invisibleHand);if(profile.deadMansTrigger){commandDraw('deck',profile.deadMansDraw||2);commandDraw('command',profile.deadMansBread||2)}}return profile
}
function commandCast(program,{owner=turn,times=1}={}){
 const instructions=Array.isArray(program)?program:normalEffectProgram(program,owner);if(!instructions)return null;
 const results=[];for(let n=0;n<commandQuantity(times);n++)for(const instruction of instructions){const [name,...args]=instruction;results.push(commandRun(name,...args))}return results
}

// One balance specification feeds display, availability, payment and Bot planning.
const BALANCED_INSTALL_COSTS=Object.freeze({"mine":{"faces":[[1,2]],"resources":{"y":4}},"farm":{"faces":[[3,4]],"resources":{"p":4}},"barracks":{"faces":[[5,6]],"resources":{"r":4}},"commandroom":{"faces":[[3,4]],"resources":{"y":4,"r":2}},"church":{"faces":[[1,4]],"resources":{"y":4,"p":2}},"lordmeeting":{"faces":[[1,6]],"resources":{"y":6}},"blackcasino":{"faces":[2,5],"resources":{"p":5}},"greatermine":{"faces":[1,2],"resources":{"y":7}},"greaterfarm":{"faces":[3,4],"resources":{"p":7}},"greaterbarracks":{"faces":[5,6],"resources":{"r":7}},"greatercommand":{"faces":[3,4],"resources":{"y":4,"r":3}},"famine":{"faces":[3,3,3],"resources":{"p":6}},"swordhunt":{"faces":[6],"resources":{"r":7}},"laws":{"faces":[],"resources":{"y":8}},"landgrab":{"faces":[2,5],"resources":{"y":3,"p":3,"r":3}},"bandit":{"faces":[null,null,null],"resources":{"y":7,"p":5}}});
// A pure complete payment plan; failed validation never consumes resources.
function resourceCostPlan(cost={},owner=turn){
 const held=powers[owner];if(!held)return null;const plan={y:0,p:0,r:0};
 if(Object.keys(cost).some(k=>!['y','p','r'].includes(k)))return null;
 for(const k of ['y','p','r'])if(!Number.isSafeInteger(cost[k]??0)||(cost[k]??0)<0)return null;
 if(!hasEquivalentExchange(owner)){for(const k of ['y','p','r']){plan[k]=cost[k]||0;if(held[k]<plan[k])return null;}return plan;}
 let remaining=['y','p','r'].reduce((n,k)=>n+(cost[k]||0),0);
 if(['y','p','r'].reduce((n,k)=>n+held[k],0)<remaining)return null;
 for(const k of ['y','p','r']){plan[k]=Math.min(held[k],cost[k]||0);remaining-=plan[k];}
 for(const k of ['y','p','r']){const n=Math.min(remaining,held[k]-plan[k]);plan[k]+=n;remaining-=n;}
 return plan;
}
function canPayResourceCost(cost={},owner=turn){return resourceCostPlan(cost,owner)!==null}
function payResourceCost(cost={},owner=turn){const plan=resourceCostPlan(cost,owner);if(!plan)return false;for(const k of ['y','p','r'])powers[owner][k]-=plan[k];return true;}

function balancedInstallCost(c){return BALANCED_INSTALL_COSTS[c?.special]||null}
function balancedCostValid(c,choices,{upgrade=false}={}){
 const spec=balancedInstallCost(c);if(!spec||!canPayResourceCost(spec.resources))return false;
 const needs=upgrade?[]:spec.faces;if(choices.length!==needs.length||new Set(choices).size!==choices.length)return false;
 return needs.every((face,i)=>{const [kind,n]=String(choices[i]).split(':'),values=Array.isArray(face)?face:face===null?null:[face];
  if(kind==='free')return installCostOptions(null).some(o=>o.id===choices[i]);
  const value=kind==='d'?unusedDice().find(d=>d.id===+n)?.value:kind==='b'?breadHands[turn][+n]?.value:undefined;
  return value!==undefined&&(value==='any'||!values||values.includes(value))
 })
}
function balancedCostChoices(c){
 const spec=balancedInstallCost(c);if(!spec)return null;
 const opts=installCostOptions(null),selected=[],used=new Set();
 function search(i){if(i===spec.faces.length)return selected.slice();const face=spec.faces[i],values=Array.isArray(face)?face:face===null?null:[face];
  for(const o of opts){if(used.has(o.id))continue;const [kind,n]=o.id.split(':'),v=kind==='d'?unusedDice().find(d=>d.id===+n)?.value:kind==='b'?breadHands[turn][+n]?.value:'any';
   if(v===undefined||values&&v!=='any'&&!values.includes(v))continue;used.add(o.id);selected.push(o.id);const result=search(i+1);if(result)return result;selected.pop();used.delete(o.id)
  }return null
 }return search(0)
}
function installBalancedCard(handIndex,choices,upgradeIndex=null){
 const c=hands[turn][handIndex],spec=balancedInstallCost(c);if(!spec)return false;
 const base={greatermine:'mine',greaterfarm:'farm',greaterbarracks:'barracks',greatercommand:'commandroom'}[c.special],upgrade=upgradeIndex!==null;
 const replaced=upgrade?installed[turn][upgradeIndex]:null;
 if(upgrade&&(!base||!cardCommands.can(replaced,'installed')||replaced.special!==base))return false;
 if(!balancedCostValid(c,choices,{upgrade}))return false;
 // Validate the whole payment before consuming anything; descending indices preserve sheets.
 choices.map((v,i)=>({v,i})).sort((a,b)=>{const index=x=>x.v.startsWith('b:')?+x.v.split(':')[1]:-1;return index(b)-index(a)}).forEach(({v,i})=>{
  const face=spec.faces[i];if(Array.isArray(face))consumeOneOf(v,face);else consumeCostChoice(v,face)
 });
 payResourceCost(spec.resources);
 if(upgrade)cardCommands.move(replaced,'installed','discard');
 registerInstallation(turn,hands[turn].splice(handIndex,1)[0]);renderGame();return true
}

function normalEffectProgram(card,owner=turn){
 const s=card?.special,boosts={mine:['y','legendmine'],farm:['p','legendfarm'],barracks:['r','legendbarracks']},greater={greatermine:'y',greaterfarm:'p',greaterbarracks:'r'};
 if(boosts[s]){const [key,legend]=boosts[s],amount=commandBoost(3,3,{count:installed[owner].some(c=>c.special===legend)?1:0});return [['pool',key,amount,{owner}]]}
 if(greater[s])return [['pool',greater[s],5,{owner}]];
 if(s==='commandroom'||s==='greatercommand')return [['draw','command',s==='greatercommand'?3:2,{owner}]];
 if(s==='church')return [['draw','deck',2,{owner}]];
 if(s==='bandit')return [['pool','y',commandCount('players',p=>p!==owner&&commandCount('resources',()=>true,{owner:p})>=8)*playerScaledGain(),{owner}]];
 return null
}
function commandEnd(){return completeEnd()}
function commandTheEnd(){return finishGame()}
function commandRun(name,...args){const text=String(name).trim().replace(/\s+/g,' '),match=text.match(/^雇用 (レベルアップ|融合)(?: (通常|モノマネ|特殊))? ([1-9]\d*)$/);if(match){if((match[1]==='融合')!==!!match[2])throw new RangeError('Invalid hiring command');return match[2]?commandHire('融合',match[2],Number(match[3]),args[0]||{}):commandHire('レベルアップ',Number(match[3]),args[0]||{})}const key=String(name).trim().replace(/\s+/g,' ');if(!Object.hasOwn(cardCommands,key)||key==='run')throw new RangeError('Unknown command '+key);return cardCommands[key](...args)}
function conversionBonus(owner=turn){return stackedNumericEffect(owner,'dieResourceBonus')+(owner===turn&&copiedAbility==='神の恩恵'?(abilityProfile(copiedAbility).dieResourceBonus||0):0)}
function exchangeRateFor(owner=turn){const lord=CHARACTER_DATA[charOf(owner)]||{},staff=employees[owner]||[];return lord.exchangeRate===1||staff.some(e=>e.exchangeRate===1||e.uniqueAbility==='等価交換')||(owner===turn&&copiedAbility==='等価交換')?1:3}
function commandApi(owner=turn){
 const active=()=>{if(owner!==turn)throw new Error('Dice and active-turn commands require the active player')};
 const api=Object.freeze({...cardCommands,
  pool:(key,n,opts={})=>commandPool(key,n,{owner,...opts}),draw:(target,n,opts={})=>commandDraw(target,n,{owner,...opts}),
  choice:(target,n,opts={})=>commandChoice(target,n,{owner,...opts}),count:(target,where,opts={})=>commandCount(target,where,{owner,...opts}),
  can:(target,test,opts={})=>commandCan(target,test,{owner,...opts}),remove:(target,opts={})=>commandRemove(target,{owner,...opts}),
  toba:(opts={})=>commandToba({owner,...opts}),cast:(program,opts={})=>commandCast(program,{owner,...opts}),
  change:(target,n,opts={})=>typeof n==='object'&&!Array.isArray(n)?commandChange(target,{owner,...n}):commandChange(target,n,{owner,...opts}),
  dice:(...args)=>{active();return commandDice(...args)},koyou:(...args)=>{active();return commandHire(...args)},hire:(...args)=>{active();return commandHire(...args)},
  end:()=>{active();return commandEnd()},'the end':()=>{active();return commandTheEnd()},
  run:(name,...args)=>{if(/^雇用\s/.test(String(name))){active();return commandRun(name,...args)}const key=String(name).trim().replace(/\s+/g,' ');if(!Object.hasOwn(api,key)||key==='run')throw new RangeError('Unknown command');return api[key](...args)}
 });return api
}
const cardCommands=Object.freeze({pool:commandPool,draw:commandDraw,dice:commandDice,limit:commandLimit,choice:commandChoice,move:commandMove,start:commandStart,change:commandChange,can:commandCan,count:commandCount,plus:commandPlus,trigger:commandTrigger,koyou:commandHire,hire:commandHire,toba:commandToba,once:commandOnce,repeat:commandRepeat,boost:commandBoost,function:commandFunction,cast:commandCast,copy:commandCopy,remove:commandRemove,discount:commandDiscount,end:commandEnd,'the end':commandTheEnd,run:commandRun});
// @kokoryo-end-section S0026

// @kokoryo-section S0029

function installCostOptions(required=null,allowDiscount=true){let old=renderingInstallCosts;renderingInstallCosts=allowDiscount;let out=costOptions(required);renderingInstallCosts=old;return out}
function costOptions(required=null){
 let a=[];
 if(renderingInstallCosts){let discount=lordInstallDiceDiscount(),isCiel=(CHARACTER_DATA[charOf(turn)]||{}).group==='ciel';for(let i=0;i<(isCiel?discount:Math.min(discount,1));i++)a.push({id:'free:request:'+i,label:'《おねだり》免除'+(isCiel&&discount>1?' '+(i+1):'')});}
 a.push(...unusedDice().filter(d=>required===null||d.value===required).map(d=>({id:'d:'+d.id,label:'🎲'+d.value+'（実#'+d.id+'）'})));
 breadHands[turn].forEach((b,i)=>{if(required===null||b.value==='any'||b.value===required)a.push({id:'b:'+i,label:'📜'+breadLabel(b)})});
 return a
}
// @kokoryo-end-section S0029

// @kokoryo-section S0031

function consumeCostChoice(choice,required=null){
 if(String(choice).startsWith('free:request:')&&lordInstallDiceDiscount()>Number(String(choice).split(':')[2]))return true;
 if(!choice)return false;
 let [k,n]=String(choice).split(':');
 if(k==='d'){let d=unusedDice().find(x=>x.id===+n&&(required===null||x.value===required));if(!d)return false;d.used=true;return true}
 if(k==='b'){let i=+n,b=breadHands[turn][i];if(!b||(required!==null&&b.value!=='any'&&b.value!==required))return false;breadDiscard.push(breadHands[turn].splice(i,1)[0]);recycleBreadIfEmpty();return true}
 return false
}
function distinctCostChoices(a,b){return a&&b&&a!==b}

function canAcquireDebt(){return endgameStarter===null&&!gameEnded&&!specialOwners(cfg=>cfg.onAcquire?.disableFutureDebt).length}
function acquireDebt(p,n=1){
 n=Math.max(0,Math.floor(+n||0));
 if(!canAcquireDebt()||!n)return 0;
 let take=Math.min(n,komePlace);
 commandCounts[p]=(commandCounts[p]||0)+take;
 komePlace-=take;
 return take
}

// 枚数制限のある獲得物を対象順に配る共通処理。
// 「全員」は発動者から、「自分以外」は次のプレイヤーから開始する。
// 各対象の指定枚数を配り切ってから次の対象へ進み、在庫が尽きたら終了。
function distributeLimitedAcquisition(owner,target,amount,acquire){
 const includeOwner=target==='all';
 if(target!=='all'&&target!=='others')throw Error('不正な配布対象: '+target);
 const count=Math.max(0,Math.floor(Number(amount)||0)),results=[];
 for(let offset=includeOwner?0:1;offset<playerCount;offset++){
  const p=(owner+offset)%playerCount;
  const got=count>0?Math.max(0,Number(acquire(p,count))||0):0;
  results.push({player:p,requested:count,received:got});
  if(got<count)break;
 }
 return results;
}
// 《領主会議》など、発動者とほかの全員で獲得枚数が違う効果用。
function distributeLimitedByQuota(owner,target,quota,acquire){
 const includeOwner=target==='all',results=[];
 if(target!=='all'&&target!=='others')throw Error('不正な配布対象: '+target);
 for(let offset=includeOwner?0:1;offset<playerCount;offset++){
  const p=(owner+offset)%playerCount;
  const n=Math.max(0,Math.floor(Number(typeof quota==='function'?quota(p):quota)||0));
  const got=n>0?Math.max(0,Number(acquire(p,n))||0):0;
  results.push({player:p,requested:n,received:got});
  if(got<n)break;
 }
 return results;
}
function distributeDebt(owner,target,amount){return distributeLimitedAcquisition(owner,target,amount,acquireDebt)}
function distributeCommandsByQuota(owner,target,quota){return distributeLimitedByQuota(owner,target,quota,(p,n)=>{let got=0;for(let i=0;i<n;i++){if(!drawBread(p))break;got++}return got})}
// @kokoryo-end-section S0031

// @kokoryo-section S0039

function start(){let chosenDeck=captureLocalRuleSettings();const draftError=initialDraftSetupError(+q('#playerCount').value);if(draftError)return alert(draftError);if(DECK_PRESETS[chosenDeck]&&!deckPresetAvailable(chosenDeck))return alert('このデッキに必要なカードが一部使用できないため選択できません。');let slots=gameSettings.legendSlots;if(chosenDeck==='custom'&&customDeck.lowerLegendKeys.length<6)return alert('カスタムデッキはLower Legendを最低6種類採用してください。');if(slots>legendSlotMax(chosenDeck))return alert('下位レジェンド数がデッキの設定上限を超えています。');q('#endturn').disabled=false;q('#reroll').disabled=false;playerCount=+q('#playerCount').value;resolveActiveRuleCards();
 if(gameSettings.deckId==='standard2')gameSettings.enabledPacks=['pack1']; if(gameSettings.deckId==='standard3')gameSettings.enabledPacks=['pack2']; if(gameSettings.deckId==='allcards')gameSettings.enabledPacks=['pack1','pack2'];syncMarketTargetUI();let groups=[...document.querySelectorAll('#characterSelects .char-row')].slice(0,playerCount).map(x=>x.dataset.family);if(new Set(groups).size!==groups.length)return alert('同じキャラクターは選択できません。');characters=selectedCharacterIds().slice(0,playerCount);characterMode=characters[0];resetGameEndState();let deal=createInitialDraftDeal(playerCount);packs=deal.packs;unusedStd=deal.unused;hands=Array.from({length:playerCount},()=>[]);selected=Array(playerCount).fill(false);powers=Array.from({length:playerCount},()=>({y:0,r:0,p:0}));installed=Array.from({length:playerCount},()=>[]);temporary=Array.from({length:playerCount},()=>[]);elekiterUsed=Array(playerCount).fill(false);commandCounts=Array(playerCount).fill(0);komePlace=100;pendingParkPlayers=[];pendingParkTaken=[];installEffectStack=[];parkChoiceRevision=0;breadDeck=makeBreadDeck();breadDiscard=[];breadHands=Array.from({length:playerCount},()=>[]);employeeDeck=[];employees=Array.from({length:playerCount},()=>[]);lordOracleUsed=Array(playerCount).fill(false);lordTributeUsed=Array(playerCount).fill(false);lordFirstBreadUsed=Array(playerCount).fill(false);lordOverclockUsed=Array(playerCount).fill(false);pendingOverclockChoices=[];debugVP=Array(playerCount).fill(0);graveyardUsed=Array(playerCount).fill(false);publicMarketUsed=Array(playerCount).fill(false);hiredThisTurn=false;organizationUsed=[];nightEscapePostAvailable=false;nightEscapeResetNext=Array(playerCount).fill(false);fusionUsedThisTurn=false;pendingSSRBonus=0;pendingCastResourceChoices=[];playLogReset();round=0;viewer=0;deck=[];market=[];discard=[];selectedMarketKey=null;marketUndoHistory=[];commandUndoHistory=[];dialogLog=[];let dlc=q('#dialogLogCount');if(dlc)dlc.textContent='0';turn=0;dice=[];q('#setup').classList.add('hidden');q('#draft').classList.remove('hidden');q('#game').classList.add('hidden');q('#start').textContent='最初から';q('#status').textContent='第1巡：各自8枚から1枚選択。5巡で5枚獲得します。全員終了後に一斉パスします。';renderDraft()}
// @kokoryo-end-section S0039

// @kokoryo-section S0041

function pick(i){if(selected[viewer]||!Number.isInteger(i)||!packs[viewer]?.[i])return;hands[viewer].push(packs[viewer][i]);packs[viewer].splice(i,1);selected[viewer]=true;if(selected.every(Boolean)){if(round>=INITIAL_DRAFT.picks-1){setupGame();return}let old=packs.map(x=>[...x]),next=Array.from({length:playerCount},()=>[]);for(let p=0;p<playerCount;p++)next[(p+1)%playerCount]=old[p];packs=next;round++;selected=Array(playerCount).fill(false);viewer=0;q('#status').textContent='残り'+packs[0].length+'枚を一斉に次のプレイヤーへ渡しました。';renderDraft();return}let n=viewer;do{n=(n+1)%playerCount}while(selected[n]);viewer=n;renderDraft()}
// @kokoryo-end-section S0041

// @kokoryo-section S0047


function setupGame(){playLogEvent('draft_completed',{},true);initLegends();let leftovers=packs.flat(),normalDeck=normalCardsForDeck(gameSettings.deckId);deck=sh([...unusedStd,...leftovers,...normalDeck,...makeRandomizerCards()]);market=[];resetNormalCardAudit();q('#draft').classList.add('hidden');q('#gamestartsetup').classList.remove('hidden');q('#game').classList.add('hidden');q('#status').textContent='適用ルール：勝利'+gameSettings.winVP+'VP／公開'+gameSettings.marketTypes+'種／初期資源'+gameSettings.initialResources+'／手札上限'+gameSettings.handLimit+'／雇用上限'+gameSettings.hireLimit+'／下位レジェンド'+gameSettings.legendSlots+'。各プレイヤーの初期資源を選択してください。';renderInitialPowerSetup()}
let initialPowerChoices=[];
let initialPowerPlayer=0;
// @kokoryo-end-section S0047

// @kokoryo-section S0049

function resolveGameStartCharacterEffects(){
 // 現在の領主固有能力はゲーム開始時に直接処理しない。
 // 《神算鬼謀》の初回ボーナスは、その能力を持つ領主／キャストごとに最初のターン開始時に独立して処理する。
}
function chooseFirstPlayer(){return (debugLocalMode||(onlineDebugMode&&!botMatchMode))?0:Math.floor(Math.random()*playerCount)}
function confirmInitialPowers(){if(!initialPowerChoices.every(v=>v.y+v.r+v.p===gameSettings.initialResources))return alert('全プレイヤーの初期資源を選んでください。');for(let p=0;p<playerCount;p++)powers[p]={...initialPowerChoices[p]};resolveGameStartCharacterEffects();saveDebugInitialMarketSnapshot();refillTo8();q('#gamestartsetup').classList.add('hidden');q('#game').classList.remove('hidden');q('#status').textContent='ゲーム開始時処理完了。勝利条件 '+gameSettings.winVP+'VP。オープンマーケットを公開しました。';turn=chooseFirstPlayer();beginTurn()}
function playerScaledGain(){return playerCount===2?5:playerCount===3?4:playerCount===4?3:2}
// @kokoryo-end-section S0049

// @kokoryo-section S0052

// 全設置経路（通常・無から設置・無料設置・効果設置）で共通の設置時効果を実行する。
function registerInstallation(owner,c){if(isLegendCard(c)&&!legendAcquisitionAllowed(owner)&&specialLegendAcquireOwner!==owner)return false;temporary[owner].push(c);triggerLandGrab(owner);resolveOnInstall(c,owner)}
// @kokoryo-end-section S0052

// @kokoryo-section S0054

let turnStartPostPending=false, depressionStartSuppressed=false;
function beginTurn(){
 replicaOwners=replicaOwners.filter(p=>p!==turn);repeatBooksPending=[];
 turnClockBeginTurn();
 if(realOnlineMainMode&&turnClockNet?.completing){turnClockStartPending=true;turnClockChoice=null;turnStartPostPending=false;return}
 turnClockStartPending=false;
 turnStartPostPending=false;
 if(nightEscapeResetNext[turn]){
  nightEscapeResetNext[turn]=false;lordFirstBreadUsed[turn]=false;lordOverclockUsed[turn]=false;
  (employees[turn]||[]).forEach(e=>{e._firstBreadUsed=false;e._overclockUsed=false});
  triggerNotices.push('《夜逃げ》：領主と雇用キャラクターのゲーム中1回の効果を再発動します。');
 }
 nightEscapePostAvailable=false;
 playLogChanges('previous_turn');playLogEvent('turn_start',{player:turn+1},true);legendTakenThisTurn=false;stdAbilityUsed={};copiedAbility=null;copiedOracleUsed=false;copiedTributeUsed=false;
 allFieldCards(turn).forEach(c=>{if(c._eraAcquiredThisTurn)c._eraAcquiredThisTurn=false});
 if(gameEnded)return;
 if(lastCountedTurnToken!==turnClockState.token){playerTurnCounts[turn]=(+playerTurnCounts[turn]||0)+1;oracleUpgradesThisTurn[turn]=0;lastCountedTurnToken=turnClockState.token;}
 hiredThisTurn=false;organizationUsed=[];nextHireMinRarity=null;nextHireExtra=0;fusionUsedThisTurn=false;lordOracleUsed[turn]=false;lordTributeUsed[turn]=false;graveyardUsed[turn]={};publicMarketUsed[turn]={};clearMarketUndo();
 if(runTurnStartSpecialAcquirePhase('pre'))return;
 if(resolveAbilityCopyLegend(()=>continueBeginTurn()))return;
 continueBeginTurn();
}
function continueBeginTurn(){
 const suppressDepressionStart=depressionDebtLocked(turn)&&allFieldCards(turn).some(c=>specialEffectId(c)==='greatDepression'&&c._eraAcquiredThisTurn);
 const depressionResourceBaseline=suppressDepressionStart?{...powers[turn]}:null;
 depressionStartSuppressed=suppressDepressionStart;
 if(depressionDebtLocked(turn)&&!suppressDepressionStart){gainResource(turn,'p',5,'depressionBonus');gainResource(turn,'r',5,'depressionBonus');}
 let lord=activeLordAbility(turn),staff=characterActivationEnabled(turn)?employees[turn]||[]:[],randomBonus=staff.reduce((n,x)=>n+(x.noCommonDie?0:((x.rarity==='SSR'||x.rarity==='UR')?0:1))+(employeeUniqueAbilitiesEnabled(turn)?(x.extraRandomDice||0):0),0)+(characterActivationEnabled(turn)?stackedNumericEffect(turn,'extraDice'):0)+(abilityProfile(copiedAbility)?.extraDice||0);
 pendingSSRBonus=staff.reduce((n,x)=>n+(x.noCommonDie?0:((x.rarity==='SSR'||x.rarity==='UR')?1:0))+(employeeUniqueAbilitiesEnabled(turn)?(x.extraChosenDice||0):0),0);
 pendingCastResourceChoices=[];
 // パック1金融系雇用：所有者のターン開始時に個体ごと発動。負債禁止はacquireDebtが判定。
 staff.forEach(e=>{if(!employeeUniqueAbilitiesEnabled(turn)||!e.financeIncome)return;let f=e.financeIncome;
  if(f.self)gainResource(turn,'y',f.self,'effect');
  for(let p=0;p<playerCount;p++){if(p===turn)continue;if(f.others)gainResource(p,'y',f.others,'effect');if(f.debt)acquireDebt(p,f.debt)}
  triggerNotices.push('《'+e.name+'》：ターン開始時の金融効果を発動しました。');
 });
 if(hasActiveRule('RC4'))pendingOverclockChoices.push({name:'超好景気',remaining:2,label:'RC4《超好景気》',total:2});
 staff.forEach(e=>{e.oracleUsedTurn=false;e.tributeUsedTurn=false;if(!employeeUniqueAbilitiesEnabled(turn))return;if(e.deadMansTrigger){cardCommands.draw('deck',e.deadMansDraw||2);cardCommands.draw('command',e.deadMansBread||2)}if(e.flexibleResourceTotal)pendingOverclockChoices.push({name:e.name,remaining:e.flexibleResourceTotal,label:e.name,total:e.flexibleResourceTotal});else if(e.chooseResource)pendingCastResourceChoices.push({name:e.name,amount:e.amount||0});else if(e.resource&&e.amount)cardCommands.pool(e.resource,e.amount)});
 dice=[];for(let i=0;i<3+randomBonus;i++)cardCommands.dice('roll',{count:1,source:i<3?'base':(i<3+(lord.extraDice||0)?'lord':'employee')});
 elekiterUsed[turn]=false;q('#limit').classList.add('hidden');
 resolveReactiveRolls();
 pendingLordResource=3+(lord.extraLordResource||0)+(abilityProfile(copiedAbility)?.extraLordResource||0);
 runRuleHook('turnStart',{player:turn});resolveTurnStartEffects();runInstalledPackHooks('turnStart',turn);
 let deadLord=activeLordAbility(turn);if(deadLord?.deadMansTrigger){cardCommands.draw('deck',deadLord.deadMansDraw||2);cardCommands.draw('command',deadLord.deadMansBread||2)}
 let hasGuild=installed[turn].some(c=>c.special==='naroppaGuild'); if(hasGuild){}
 if(suppressDepressionStart){
  // 獲得ターンだけ、通常・追加・選択式の全ダイスと開始時資源獲得を抑止する。
  dice=[];pendingSSRBonus=0;
  if(!hasEquivalentExchange(turn)){pendingLordResource=0;pendingNanban=0;pendingTenkuCat=0;pendingCastResourceChoices=[];pendingOverclockChoices=[];
  for(const k of ['y','p','r'])powers[turn][k]=Math.min(powers[turn][k],depressionResourceBaseline[k]);}
  triggerNotices.push('《世界恐慌》：獲得したターンの開始時資源獲得と全サイコロ獲得を無効化しました。');
 }
 depressionStartSuppressed=false;
 if(hasEquivalentExchange(turn))cardCommands.pool('y',5);
 repeatBooksPending=installed[turn].filter(c=>c.special==='repeatBook');
 turnStartPostPending=true;nightEscapePostAvailable=false;renderGame()
}
// @kokoryo-end-section S0054

// @kokoryo-section S0061

function unusedDice(){return dice.filter(d=>!d.used)} function dieSelect(list){return makeChoicePicker(list.map(d=>({id:d.id,label:'🎲'+d.value+'（#'+d.id+'）'})))} function useDie(id){let d=dice.find(x=>x.id===+id);if(!d||d.used)return null;d.used=true;return d}
function colorFor(v){return v<=2?'y':v<=4?'p':'r'}
// @kokoryo-end-section S0061

// @kokoryo-section S0063

function fixedVP(c){return typeof c.vp==='number'?c.vp:0}
function allFieldCards(p){return [...installed[p],...temporary[p]]}
// @kokoryo-end-section S0063

// @kokoryo-section S0065

function totalVP(p){return allFieldCards(p).reduce((a,c)=>a+cardVP(c,p),0)+groupedCharacterVP(p)+(debugVP[p]||0)}
// @kokoryo-end-section S0065

// @kokoryo-section S0067

function checkEndgameTrigger(){
 if(gameEnded||endgameStarter!==null)return;
 if(totalVP(turn)>=gameSettings.winVP){endgameStarter=turn;endgameRemaining=playerCount-1;triggerNotices.push('P'+(turn+1)+'が自分の手番中に'+gameSettings.winVP+'VP以上になりました。 このプレイヤー以外の全員が1手番ずつ終えた後に勝敗を判定します。最終ターン中は新たな負債を獲得できません。');renderSharedEndgameStatus();}
}
// @kokoryo-end-section S0067

// @kokoryo-section S0086

function isViewingOwnTurn(){return !(onlineDebugMode||realOnlineMainMode)||viewer===turn}
// @kokoryo-end-section S0086

// @kokoryo-section S0110

function handLimit(p){return cardCommands.limit('hand',2,{count:installed[p].filter(c=>c.special==='warehouse').length+temporary[p].filter(c=>c.special==='warehouse').length})}function finishTurn(){if(pendingNormalInstallChoice)return; if(pendingParkPlayers.length)return alert('ナーロッパランドの公開カード選択を全員分終えてください。');if(handLimitNeedsDiscard(turn)){showHandLimit();return}completeEnd()}
// @kokoryo-end-section S0110

// @kokoryo-section S0112

function turnClockOriginalCompleteEnd(){playLogChanges('turn_end');playLogEvent('turn_end',{player:turn+1},true);
 runInstalledPackHooks('turnEnd',turn);
 runRuleHook('turnEnd',{player:turn});
 dice=[];if(temporary[turn].length){installed[turn].push(...temporary[turn]);temporary[turn]=[]}refillTo8();
 logNormalCardAudit('turn_end_finalized');
 if(endgameStarter!==null&&turn!==endgameStarter){endgameRemaining--;let box=q('#gameover');if(endgameRemaining>0){box.className='notice endgame-progress';box.innerHTML='<strong>⚑ ゲーム終了処理中</strong><div>P'+(endgameStarter+1)+'が'+gameSettings.winVP+'VP到達｜残り最終ターン：'+endgameRemaining+'人</div>';}if(endgameRemaining<=0){finishGame();if(realOnlineMainMode)broadcastRealGameFinished(turn);return}}
 turn=(turn+1)%playerCount;
 // オンラインデバッグでは次プレイヤーの開始時判定より先に操作視点を同期する。
 // 実オンライン対戦のviewerは各接続者に固定するため変更しない。
 if(onlineDebugMode&&!realOnlineMainMode&&!botMatchMode)viewer=turn;
 beginTurn();if(botMatchMode)queueBotTurn();
 // 手番が変わった後でも、直前の操作プレイヤーから確実に状態を送信する。
 if(realOnlineMainMode){const previousPlayer=(turn+playerCount-1)%playerCount;broadcastRealMainState(previousPlayer)}
}
// @kokoryo-end-section S0112

// @kokoryo-section S0114

function resetGameEndState(){
 pendingTrade241=null;tradeRevision241=0;q('#tradeModal241')?.remove();replicaOwners=[];repeatBooksPending=[];pendingNormalInstallChoice=false;specialLegendAcquireOwner=null;
 playerTurnCounts=Array(playerCount).fill(0);lastCountedTurnToken=-1;oracleUpgradesThisTurn=Array(playerCount).fill(0);
 turnClockReset();
 endgameStarter=null;endgameRemaining=0;gameEnded=false;
 let box=q('#gameover');if(box){box.className='notice hidden';box.innerHTML=''}
 let end=q('#endturn');if(end)end.disabled=false;
 let reroll=q('#reroll');if(reroll)reroll.disabled=false;
}
function finishGame(){
 turnClockStop();playLogChanges('game_finish');playLogEvent('game_finished',{},true);
 gameEnded=true;let scores=Array.from({length:playerCount},(_,p)=>({p,vp:totalVP(p)+((commandCounts[p]||0)*debtFinalVPPerCard(p)),cards:allFieldCards(p).length}));
 let bestVP=Math.max(...scores.map(x=>x.vp)),top=scores.filter(x=>x.vp===bestVP),bestCards=Math.max(...top.map(x=>x.cards)),winners=top.filter(x=>x.cards===bestCards);
 renderSharedEndgameStatus();
 q('#endturn').disabled=true;q('#reroll').disabled=true;renderPlayers()
}
// @kokoryo-end-section S0114

// @kokoryo-section S0122

// Ver.2.52 entry gate and online-version test lobby.
// BOT mode must be initialized before the first debug visibility refresh.
let botMatchMode=false,botBusy=false,botTimer=null;
let debugLocalMode=false, onlineDebugMode=false;
let onlineDebugPlayers=[];
function updateDebugCommandVisibility(){
 const enabled=!botMatchMode&&(debugLocalMode||onlineDebugMode);
 const tab=q('#debugCommandTab'); if(tab)tab.style.display=enabled?'':'none';
 const panel=q('#debugpanel'); if(panel)panel.style.display=enabled?'':'none';
}
// @kokoryo-end-section S0122

// @kokoryo-section S0128


function turnClockConvertNormalDie(dieId){const result=cardCommands.change('convert',3,{kind:'die',dieId,undo:true,record:true});if(result.ok)renderGame()}
// Shared offline / Bot / online chess clock. Online completion is host-authoritative.
var turnClockState={remaining:[],active:null,token:0,lastCompleted:-1,ending:false,expiring:false,resolving:false,timeoutCommit:null,mono:0,wall:0};
const TURN_CLOCK_INITIAL=300000,TURN_CLOCK_INCREMENT=60000;
const TURN_CLOCK_CANCEL=Object.freeze({cancelledBotTurn:true});
function turnClockVisible(){return !!q('#game')&&!q('#game').classList.contains('hidden')}
function turnClockReset(){
 if(typeof turnClockNet!=='undefined')turnClockResetNet();
 if(!turnClockState)return;
 const token=turnClockState.token+1;
 turnClockState={remaining:Array(playerCount).fill(TURN_CLOCK_INITIAL),active:null,token,lastCompleted:-1,ending:false,expiring:false,resolving:false,timeoutCommit:null,mono:performance.now(),wall:Date.now()};
 if(botTimer!==null){clearTimeout(botTimer);botTimer=null}
 turnClockRender();
}
function turnClockAccount(){
 const s=turnClockState;if(!s)return;
 const mono=performance.now(),wall=Date.now();
 // Safari may suspend interval callbacks. Use elapsed time, not tick counts.
 const elapsed=Math.max(0,mono-s.mono,wall-s.wall);
 if(s.active!==null&&!s.ending&&!s.expiring&&!gameEnded&&turnClockVisible())
  s.remaining[s.active]=Math.max(0,s.remaining[s.active]-elapsed);
 s.mono=mono;s.wall=wall;
}
function turnClockBeginTurn(){
 const s=turnClockState;if(!s||gameEnded)return;
 // Reroll/debug beginTurn on the same turn neither resets time nor grants increment.
 if(s.active===turn){turnClockAccount();return}
 while(s.remaining.length<playerCount)s.remaining.push(TURN_CLOCK_INITIAL);
 s.active=turn;s.token++;s.mono=performance.now();s.wall=Date.now();
 turnClockRender();
}
function turnClockStop(){if(!turnClockState)return;turnClockAccount();turnClockState.active=null;turnClockRender()}
function turnClockLeaseValid(owner,token){const s=turnClockState;return !!s&&s.active===owner&&turn===owner&&s.token===token&&!gameEnded}
// @kokoryo-end-section S0128

// @kokoryo-section S0131

function turnClockTick(){
 if(realOnlineMainMode)turnClockNetworkTick();
 const s=turnClockState;if(!s)return;
 turnClockAccount();turnClockRender();
 if(s.active!==null&&s.remaining[s.active]<=0&&!s.expiring&&!s.ending&&!gameEnded&&turnClockVisible())turnClockExpire(s.token);
}
function turnClockPrompt(message,initial){
 if(turnClockState?.resolving||botIsPlayer(turn))return initial??'1';
 const result=window.prompt(message,initial);turnClockAccount();
 if(turnClockState?.active!==null&&turnClockState.remaining[turnClockState.active]<=0){queueMicrotask(turnClockTick);return null}
 return result;
}
function turnClockConfirm(message){
 if(turnClockState?.resolving)return false; // optional acquisitions are declined
 const result=window.confirm(message);turnClockAccount();
 if(turnClockState?.active!==null&&turnClockState.remaining[turnClockState.active]<=0){queueMicrotask(turnClockTick);return false}
 return result;
}
function turnClockResolvePending(owner,token){
 if(pendingTrade241)finishTrade241('トレード：持ち時間終了のため交換せず終了しました。');
 for(const overlay of document.querySelectorAll('[data-turn-clock-payment]'))overlay.__turnClockCancel?.();
 legendPaymentPending=false;
 for(let guard=0;guard<10000;guard++){
  if(!turnClockLeaseValid(owner,token))return;
  const modal=q('#legendChoiceModal');
  if(modal&&!modal.classList.contains('hidden')){
   const title=q('#legendChoiceTitle').textContent;
   if(title==='オルフェンズ'||title==='消費する資源')q('#legendChoiceCancel').click();
   else{
    // Bot start choices were rendered from the human viewer, with controls disabled.
    // The timeout resolver now owns this turn and may complete that mandatory choice.
    if(title==='パーフェクト・イミテーション')
     for(const el of q('#legendChoiceCards').querySelectorAll('select,button'))el.disabled=false;
    const pick=q('#legendChoiceCards .selectable-card')||q('#legendChoiceCards button:not(:disabled)');
    if(pick)pick.click();else q('#legendChoiceCancel').click();
   }
   continue;
  }
  if(pendingSSRBonus>0){gainSSRDie(1);continue}
  const color=['y','p','r'].find(c=>eraGainAllowed(owner,c,'effect'));
  if(!color){
   // Prohibited resource gains must not leave an unfinishable selection.
   pendingLordResource=0;pendingNanban=0;pendingTenkuCat=0;pendingCastResourceChoices=[];pendingOverclockChoices=[];
  }else{
   if(pendingOverclockChoices.length){gainOverclockResource(color);continue}
   if(pendingCastResourceChoices.length){gainCastResource(color);continue}
   if(pendingLordResource>0){gainLordResource(color);continue}
   if(pendingNanban>0){gainNanban(color);continue}
   if(pendingTenkuCat>0){gainTenkuCat(color);continue}
  }
  if(turnStartPostPending){renderGame();continue}
  if(pendingParkPlayers.length){
   const key=groups().keys().next().value;
   if(key===undefined)finishEmptyParkChoices();else applyOnlineParkPick(pendingParkPlayers[0],key);
   continue;
  }
  nightEscapePostAvailable=false;return;
 }
 throw new Error('持ち時間終了時の未解決選択が安全上限を超えました。');
}
function turnClockDiscardOverflow(owner){
 // Uniformly choose among both normal cards and command sheets; debt is excluded.
 while(totalHandCount(owner)>handLimit(owner)){
  const n=hands[owner].length+breadHands[owner].length;if(!n)break;
  const i=Math.min(n-1,Math.floor(Math.random()*n));
  if(i<hands[owner].length)discard.push(hands[owner].splice(i,1)[0]);
  else breadDiscard.push(breadHands[owner].splice(i-hands[owner].length,1)[0]);
 }
 recycleBreadIfEmpty();
 if(totalHandCount(owner)>handLimit(owner)&&!depressionProtectsDebtAtHandLimit()&&!depressionDebtLocked(owner)){
  const returned=Math.min(totalHandCount(owner)-handLimit(owner),commandCounts[owner]||0);
  commandCounts[owner]-=returned;komePlace+=returned;
 }
}
function turnClockCloseChoices(){
 for(const overlay of document.querySelectorAll('[data-turn-clock-payment]'))overlay.__turnClockCancel?.();
 legendPaymentPending=false;
 for(const modal of document.querySelectorAll('.imgmodal')){
  modal.classList.add('hidden');
 }
 for(const selector of ['#legendChoiceCards','#parkChoiceCards']){
  const grid=q(selector);if(!grid)continue;
  for(const el of grid.querySelectorAll('*'))el.onclick=null;
  grid.replaceChildren();
 }
 if(q('#legendChoiceCancel'))q('#legendChoiceCancel').onclick=null;
 q('#limit')?.classList.add('hidden');
 pendingBreadAnyIndex=null;pendingResourceFrom=null;clearMarketUndo();
}
function turnClockExpire(token){
 if(realOnlineMainMode&&!isRealLobbyHost())return;
 const s=turnClockState,owner=s?.active;
 if(!s||s.expiring||s.ending||owner===null||!turnClockLeaseValid(owner,token))return;
 s.expiring=true;s.resolving=true;s.remaining[owner]=0;
 if(botTimer!==null){clearTimeout(botTimer);botTimer=null}
 const oldViewer=viewer;
 try{
  viewer=owner;
  if(realOnlineMainMode){
   turnClockNet.completing=true;
   turnClockRestoreChoice();
   if(turnClockStartPending)beginTurnForClockTimeout();
  }
  turnClockResolvePending(owner,token);
  if(!turnClockLeaseValid(owner,token))return;
  const totals={y:0,p:0,r:0};
  for(const die of [...unusedDice()]){
   const color=colorFor(die.value),before=powers[owner][color];
   turnClockConvertNormalDie(die.id);
   totals[color]+=Math.max(0,powers[owner][color]-before);
  }
  // Resource-dependent VP must trigger the final round before advancing turn.
  checkEndgameTrigger();
  turnClockDiscardOverflow(owner);turnClockCloseChoices();
  addDialog('⏱ P'+(owner+1)+'の持ち時間切れ：未使用ダイスを変換（資金'+totals.y+'・食料'+totals.p+'・兵力'+totals.r+'）、手札上限を自動処理しました。');
  playLogAction('turn_clock_timeout',{player:owner+1,resources:totals});
  viewer=oldViewer;s.resolving=false;s.expiring=false;s.timeoutCommit=token;
  completeEnd();
 }finally{
  s.resolving=false;s.expiring=false;
  if(realOnlineMainMode){turnClockNet.completing=false;viewer=oldViewer;turnClockCommit();turnClockStartOwnTurn()}
  viewer=botMatchMode?0:viewer;turnClockRender();
 }
}
function completeEnd(){
 if(pendingTrade241)return;
 if(realOnlineMainMode&&!turnClockNet?.completing){turnClockRequestEnd();return}
 const s=turnClockState;
 if(!s)return turnClockOriginalCompleteEnd();
 if(gameEnded||s.active===null||s.ending||s.lastCompleted===s.token)return;
 turnClockAccount();
 if(s.remaining[s.active]<=0&&s.timeoutCommit!==s.token){turnClockExpire(s.token);return}
 const owner=s.active;
 s.ending=true;s.lastCompleted=s.token;s.timeoutCommit=null;
 s.remaining[owner]=Math.min(TURN_CLOCK_INITIAL,s.remaining[owner]+TURN_CLOCK_INCREMENT);
 s.active=null;
 try{return turnClockOriginalCompleteEnd()}finally{s.ending=false;turnClockRender()}
}
// @kokoryo-end-section S0131
