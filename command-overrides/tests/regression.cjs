// Run with Node.js 18+: node --test tests/regression.cjs
// Execute the shipped functions; only UI, networking, and unrelated effects are stubbed.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const html=require('../tools/build.cjs').inlineHtml(root);
function fn(name){
 const match=new RegExp(`^(?:async )?function ${name}\\(`,'m').exec(html);
 assert.ok(match,`Missing production function: ${name}`);
 const start=match.index;
 const next=/^(?:(?:async )?function |const |let )/gm;
 next.lastIndex=start+match[0].length;
 const end=next.exec(html)?.index??html.indexOf('</script>',start);
 return html.slice(start,end);
}
function element(){return {children:[],style:{},classList:{add(){},remove(){}},appendChild(x){this.children.push(x)},append(...xs){this.children.push(...xs)},set innerHTML(v){this.children=[]}}}
function makeEnv(names){
 if(names.includes('finalizeHire'))names=[...new Set([...names,'grantDoppelHireDie241','displayCastRarity241'])];
 const nodes={};const c={structuredClone,turn:0,viewer:0,playerCount:2,onlineDebugMode:false,realOnlineMainMode:false,
  gameSettings:{hireLimit:3,enabledPacks:['pack1','pack2']},characters:['P1','P1'],CHARACTER_DATA:{P1:{}},
  installed:[[],[]],temporary:[[],[]],hands:[[],[]],employees:[[],[]],powers:[{y:20,p:5,r:5},{y:0,p:0,r:0}],
  discard:[],market:[],deck:[],breadHands:[[],[]],breadDeck:[],breadDiscard:[],commandCounts:[0,0],
  graveyardUsed:[false,false],publicMarketUsed:[false,false],hiredThisTurn:false,nextHireMinRarity:null,nextHireExtra:0,
  triggerNotices:[],pendingOverclockChoices:[],pendingCastResourceChoices:[],lordFirstBreadUsed:[],lordOverclockUsed:[],
  playerTurnCounts:[],lastCountedTurnToken:-1,oracleUpgradesThisTurn:[],turnClockState:{token:1},lordOracleUsed:[],lordTributeUsed:[],nightEscapeResetNext:[],elekiterUsed:[],organizationUsed:[],
  endgameStarter:null,gameEnded:false,copiedAbility:null,abilityProfile:()=>null,realMainRoster:[],
  pendingSelections242:[],selectionSequence242:0,pendingTrade241:null,tradeRevision241:0,replicaOwners:[],repeatBooksPending:[],specialLegendAcquireOwner:null,characterActivationEnabled:()=>true,activeLordAbility:p=>c.CHARACTER_DATA[c.characters[p]]||{},notifyStaffingAgency(){},resolveAmicableRetirement(){},
  turnClockBeginTurn(){},turnClockRender(){},turnClockAcceptSnapshot:()=>true,turnClockAfterSnapshot(){},turnClockSnapshot:()=>null,
  turnClockStartPending:false,turnClockChoice:null,turnStartPostPending:false,depressionStartSuppressed:false,stdAbilityUsed:{},
  dice:[{id:1,value:1,used:false},{id:2,value:2,used:false}],alerts:[],prompts:[],rules:[],renderedHireFlags:[],
  document:{createElement:element},q:s=>nodes[s]??=element(),nodes,
  alert(msg){c.alerts.push(msg)},prompt(){return c.prompts.shift()??null},confirm:()=>false,
  turnClockPrompt(){return c.prompt()},turnClockConfirm(){return c.confirm()},
  renderGame(){c.renderedHireFlags.push(c.hiredThisTurn)},renderPack2InstalledActions(){},renderPackFieldAction(){},
  chooseLegendCard(title,note,opts,choose,cancel){c.choice={opts,choose,cancel}},
  isViewingOwnTurn:()=>!c.realOnlineMainMode||c.viewer===c.turn,
  employeeUniqueAbilitiesEnabled:()=>true,allFieldCards:p=>[...c.installed[p],...c.temporary[p]],
  hasActiveRule:id=>c.rules.includes(id),isHireFree:()=>c.rules.includes('RC3'),effectiveHireLimit:()=>c.gameSettings.hireLimit+(c.rules.includes('RC3')?1:0),
  unusedDice:()=>c.dice.filter(d=>!d.used),useDie(id){let d=c.dice.find(d=>d.id===id&&!d.used);if(!d)return null;d.used=true;return d},
  gachaCast:()=>({id:'CN1',rarity:'N',name:'一般会計'}),resolveDoppelCopy:(e,done)=>{done?.(e);return e},
  gainResource(p,k,n){c.powers[p][k]+=n},drawBread(p){let b=c.breadDeck.shift()??null;if(b)c.breadHands[p].push(b);return b},
  drawOne:()=>null,breadLabel:b=>String(b.value),stackedNumericEffect:()=>0,depressionDebtLocked:()=>false,
  resolveReactiveRolls(){},runRuleHook(){},runInstalledPackHooks(){},playerScaledGain:()=>1,
  playLogChanges(){},playLogEvent(){},clearMarketUndo(){},runTurnStartSpecialAcquirePhase:()=>false,resolveAbilityCopyLegend:()=>false,
  groups(){const g=new Map();for(const card of c.market){if(!g.has(card.key))g.set(card.key,[]);g.get(card.key).push(card)}return g},
  refillMarket(){},blockAllMarketUndo(){},addDialog(){},realMyPlayerIndex:()=>0,saveRealOnlineResume(){},syncMarketTargetUI(){},
  runPackCardHook(){},packCastPool:()=>[{id:'CUR1',name:'歌音',rarity:'UR'}],upgradeRarity:r=>({N:'R',R:'SR',SR:'SSR',SSR:'UR'})[r]
 };
 vm.createContext(c);
 for(const name of ['resourceCostPlan','canPayResourceCost','payResourceCost'])vm.runInContext(fn(name),c);
 c.hasEquivalentExchange=()=>false;c.legendAcquisitionAllowed=()=>true;vm.runInContext(fn("isLegendCard"),c);
 for(const name of [...html.matchAll(/^function (command\w+)\(/gm)].map(m=>m[1]))vm.runInContext(fn(name),c);
 vm.runInContext(html.match(/^const cardCommands=.*$/m)[0],c);
 for(const name of names)vm.runInContext(fn(name),c);
 return c;
}
const normalNames=['normalCardActionUsed','useGraveyard','usePublicMarket','renderNewNormalInstalledActions'];
function fieldEnv(){
 const c=makeEnv(normalNames);
 c.installed[0]=[{id:'N11-1',special:'graveyard'},{id:'N11-2',special:'graveyard'},{id:'N14-1',special:'publicmarket'},{id:'N14-2',special:'publicmarket'}];
 c.discard=[{id:'N1-1',key:'N1',name:'A'},{id:'N2-1',key:'N2',name:'B'},{id:'N3-1',key:'N3',name:'C'}];
 c.market=[{id:'S5-1',key:'S5',name:'鉱山'},{id:'S6-1',key:'S6',name:'農場'}];return c;
}
function recover(c,index){c.useGraveyard(index);if(c.choice){const choice=c.choice;c.choice=null;choice.choose(choice.opts[0]);c.nodes['#legendChoiceCards'].children[0].onclick()}}
function buttons(c){const parent=element();c.renderNewNormalInstalledActions(parent);return parent.children.filter(x=>'disabled' in x)}
function trade(c,index){c.prompts=['1','1'];c.usePublicMarket(index,{market:1,hand:1})}
function stocked(c){c.breadDeck=Array.from({length:25},(_,i)=>({id:`B${i}`,value:i%6+1}));return c}

// Load actual character/employee properties, including the shared unique-ability definitions.
const data={window:{}};vm.createContext(data);
for(const file of ['pack1.js','pack2.js'])vm.runInContext(fs.readFileSync(path.join(root,'packs',file),'utf8'),data);
vm.runInContext(html.slice(html.indexOf('const CHARACTER_DATA='),html.indexOf('const CHARACTER_FAMILIES='))+'\nthis.lords=CHARACTER_DATA;',data);
vm.runInContext(html.slice(html.indexOf('const UNIQUE_ABILITY_DEFS='),html.indexOf('// 《無限の黄金》'))+'\nthis.apply=applyUniqueAbilityDef;',data);
vm.runInContext(html.slice(html.indexOf('const CAST_TYPES='),html.indexOf('Object.assign(CAST_TYPES,CLR_TYPES)'))+'\nthis.casts=CAST_TYPES;',data);
for(const pack of Object.values(data.window.KOKORYO_PACKS)){Object.assign(data.casts,pack.casts);Object.assign(data.lords,pack.characters)}
function employee(id){return data.apply({...data.casts[id]})}
function lord(id){return data.apply({...data.lords[id]})}
function startEnv(){const c=stocked(makeEnv(['beginTurn','continueBeginTurn','resolveTurnStartEffects']));c.charOf=p=>c.characters[p];return c}

test('all inline and pack scripts parse',()=>{for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))new vm.Script(m[1]);for(const p of ['pack1.js','pack2.js','rules_pack1.js'])new vm.Script(fs.readFileSync(path.join(root,'packs',p),'utf8'))});
test('two Orphans can each activate once; neither consumes market usage',()=>{const c=fieldEnv();recover(c,0);assert.deepEqual(buttons(c).map(b=>!!b.disabled),[true,false,false,false]);recover(c,1);assert.equal(c.hands[0].length,2);assert.equal(c.powers[0].y,18);recover(c,0);assert.equal(c.hands[0].length,2);assert.deepEqual(buttons(c).map(b=>!!b.disabled),[true,true,false,false])});
test('two markets each activate once independently of Orphans',()=>{const c=fieldEnv();trade(c,2);assert.deepEqual(buttons(c).map(b=>!!b.disabled),[false,false,true,false]);trade(c,3);assert.equal(c.powers[0].y,16);trade(c,2);assert.equal(c.powers[0].y,16)});
test('Orphans cancellation consumes neither resource nor per-card usage',()=>{const c=fieldEnv();c.useGraveyard(0);c.choice.cancel();assert.equal(c.powers[0].y,20);assert.equal(c.normalCardActionUsed(c.graveyardUsed,c.installed[0][0]),false);assert.equal(c.discard.length,3)});
test('market cancellation and invalid input are atomic',()=>{for(const prompts of [[null],['1',null],['99'],['1','99']]){const c=fieldEnv();c.prompts=prompts;c.usePublicMarket(2,{market:prompts[0]??99,hand:prompts[1]??99});assert.equal(c.powers[0].y,20);assert.equal(c.market.length,2);assert.equal(c.normalCardActionUsed(c.publicMarketUsed,c.installed[0][2]),false)}});
test('used physical card remains used when its installed index changes',()=>{const c=fieldEnv();recover(c,0);const used=c.installed[0].shift();c.installed[0].push(used);recover(c,3);assert.equal(c.hands[0].length,1);recover(c,0);assert.equal(c.hands[0].length,2)});
test('removed cards and stale cost callbacks cannot charge twice',()=>{const c=fieldEnv();c.useGraveyard(0);c.choice.choose(c.choice.opts[0]);const pay=c.nodes['#legendChoiceCards'].children[0].onclick;pay();pay();assert.equal(c.hands[0].length,1);assert.equal(c.powers[0].y,19);c.useGraveyard(1);c.choice.choose(c.choice.opts[0]);const stale=c.nodes['#legendChoiceCards'].children[0].onclick;c.installed[0].splice(1,1);stale();assert.equal(c.powers[0].y,19)});
test('usage resets only for the player beginning a new turn',()=>{const c=stocked(fieldEnv());vm.runInContext(fn('beginTurn'),c);c.continueBeginTurn=()=>{};recover(c,0);trade(c,2);c.graveyardUsed[1]={'other-card':true};c.beginTurn();assert.equal(c.normalCardActionUsed(c.graveyardUsed,c.installed[0][0]),false);assert.equal(c.normalCardActionUsed(c.publicMarketUsed,c.installed[0][2]),false);assert.equal(c.graveyardUsed[1]['other-card'],true)});
test('legacy boolean usage is conservative until next own turn',()=>{const c=fieldEnv();c.graveyardUsed[0]=true;assert.equal(c.normalCardActionUsed(c.graveyardUsed,c.installed[0][1]),true);vm.runInContext(fn('beginTurn'),c);c.continueBeginTurn=()=>{};c.beginTurn();assert.equal(c.normalCardActionUsed(c.graveyardUsed,c.installed[0][1]),false)});
test('JSON snapshot/apply retains per-card usage and normal hire state',()=>{const c=fieldEnv();recover(c,0);trade(c,2);vm.runInContext(fn('realMainSnapshot')+'\n'+fn('applyRealMainSnapshot'),c);const src=fn('realMainSnapshot');const keys=src.split('},playerCount,')[1].split('};')[0].split(',');for(const k of keys)if(!(k in c))c[k]=[];c.hiredThisTurn=true;const state=JSON.parse(JSON.stringify(c.realMainSnapshot()));c.graveyardUsed=[];c.publicMarketUsed=[];c.hiredThisTurn=false;c.applyRealMainSnapshot(state);assert.equal(c.normalCardActionUsed(c.graveyardUsed,c.installed[0][0]),true);assert.equal(c.normalCardActionUsed(c.graveyardUsed,c.installed[0][1]),false);assert.equal(c.normalCardActionUsed(c.publicMarketUsed,c.installed[0][2]),true);assert.equal(c.normalCardActionUsed(c.publicMarketUsed,c.installed[0][3]),false);assert.equal(c.hiredThisTurn,true)});
for(const [id,first,later] of [['CUR4',6,2],['CSR6',1,1],['CSSR6',1,1]])test(`${id} start commands: first ${first}, later ${later}`,()=>{const c=startEnv();c.employees[0]=[employee(id)];c.beginTurn();assert.equal(c.breadHands[0].length,first);c.beginTurn();assert.equal(c.breadHands[0].length,first+later)});
test('lord strategist keeps its first-time bonus',()=>{const c=startEnv();c.CHARACTER_DATA.P1=lord('P5');c.beginTurn();assert.equal(c.breadHands[0].length,6);c.beginTurn();assert.equal(c.breadHands[0].length,8)});
test('new/copy profiles track first-time command bonus per employee',()=>{const c=startEnv();c.employees[0]=[employee('CUR4')];c.beginTurn();c.employees[0].push(data.apply({id:'CUR13',rarity:'UR',name:'copy',uniqueAbility:'神算鬼謀'}));c.beginTurn();assert.equal(c.breadHands[0].length,14)});
test('Night Escape re-enables the first-time bonus exactly once',()=>{const c=startEnv();c.employees[0]=[employee('CUR4')];c.beginTurn();c.nightEscapeResetNext[0]=true;c.beginTurn();assert.equal(c.breadHands[0].length,12);c.beginTurn();assert.equal(c.breadHands[0].length,14)});
test('explicit ability-disabled compatibility gate grants no commands',()=>{const c=startEnv();c.employeeUniqueAbilitiesEnabled=()=>false;c.employees[0]=[employee('CUR4'),employee('CSR6')];c.beginTurn();assert.equal(c.breadHands[0].length,0);assert.equal(c.employees[0][0]._firstBreadUsed,undefined)});
test('limited command supply never duplicates physical cards',()=>{const c=startEnv();c.breadDeck=c.breadDeck.slice(0,2);c.employees[0]=[employee('CUR4')];c.beginTurn();assert.equal(c.breadHands[0].length,2);assert.equal(new Set(c.breadHands[0].map(b=>b.id)).size,2);c.beginTurn();assert.equal(c.breadHands[0].length,2)});
const hireNames=['finalizeHire','hireEmployee','useDoubleHire','renderPack2InstalledActions'];
test('normal hire consumes one die and money5, marks before rendering, blocks second',()=>{const c=makeEnv(hireNames);assert.equal(c.hireEmployee(1),true);assert.equal(c.hiredThisTurn,true);assert.equal(c.renderedHireFlags[0],true);c.hireEmployee(2);assert.equal(c.employees[0].length,1);assert.equal(c.powers[0].y,15);assert.equal(c.unusedDice().length,1)});
test('failed normal hires do not mark the turn used',()=>{for(const mode of ['money','die','capacity','turn','pool']){const c=makeEnv(hireNames);if(mode==='money')c.powers[0].y=0;if(mode==='die')c.dice=[];if(mode==='capacity')c.employees[0]=Array(3).fill({});if(mode==='turn'){c.realOnlineMainMode=true;c.viewer=1}if(mode==='pool')c.gachaCast=()=>null;c.hireEmployee(1);assert.equal(c.hiredThisTurn,false,mode)}});
test('free hiring needs no die or money but still consumes normal hire allowance',()=>{const c=makeEnv(hireNames);c.rules=['RC3'];c.powers[0].y=0;c.dice=[];assert.equal(c.hireEmployee(null),true);c.hireEmployee(null);assert.equal(c.employees[0].length,1);assert.equal(c.hiredThisTurn,true)});
test('effect hire does not consume the normal allowance',()=>{const c=makeEnv(hireNames);c.finalizeHire({id:'CN4',name:'見習い賭博師',rarity:'N',hireBread:1});assert.equal(c.hiredThisTurn,false);c.hireEmployee(1);assert.equal(c.employees[0].length,2);assert.equal(c.hiredThisTurn,true)});
test('W hire recruits two for one payment, consumes itself and normal allowance',()=>{const c=makeEnv(hireNames);c.installed[0]=[{id:'N33-1',special:'doubleHire'}];c.useDoubleHire(0);assert.equal(c.employees[0].length,2);assert.equal(c.powers[0].y,15);assert.equal(c.unusedDice().length,1);assert.equal(c.discard[0].id,'N33-1');assert.equal(c.hiredThisTurn,true);c.hireEmployee(2);assert.equal(c.employees[0].length,2)});
test('free W hire needs no money/dice and recruits two',()=>{const c=makeEnv(hireNames);c.rules=['RC3'];c.powers[0].y=0;c.dice=[];c.installed[0]=[{id:'N33-1',special:'doubleHire'}];const box=element();c.renderPack2InstalledActions(box);assert.equal(box.children[0].disabled,false);box.children[0].onclick();assert.equal(c.employees[0].length,2);assert.equal(c.hiredThisTurn,true)});
test('W hire respects capacity bonuses and does not discard on failure',()=>{for(const bonus of [false,true]){const c=makeEnv(hireNames);c.employees[0]=[{},{}];c.installed[0]=[{id:'N33-1',special:'doubleHire'}];if(bonus)c.gameSettings.hireLimit=4;c.useDoubleHire(0);assert.equal(c.employees[0].length,bonus?4:2);assert.equal(c.discard.length,bonus?1:0);assert.equal(c.powers[0].y,bonus?15:20);assert.equal(c.hiredThisTurn,bonus)}});
test('W hire without payable normal cost leaves its card intact',()=>{const c=makeEnv(hireNames);c.powers[0].y=0;c.installed[0]=[{id:'N33-1',special:'doubleHire'}];c.useDoubleHire(0);assert.equal(c.installed[0].length,1);assert.equal(c.discard.length,0);assert.equal(c.hiredThisTurn,false)});
test('additional-hire effects preserve their existing normal-allowance reset',()=>{for(const special of ['massRecruitment']){const c=stocked(makeEnv([...hireNames,'resolveOnInstall']));c.hireEmployee(1);c.resolveOnInstall({special},0);assert.equal(c.hiredThisTurn,false,special);assert.equal(c.hireEmployee(2),true,special)}});
test('turn start restores normal hire allowance',()=>{const c=makeEnv([...hireNames,'beginTurn']);c.continueBeginTurn=()=>{};c.hireEmployee(1);assert.equal(c.hiredThisTurn,true);c.beginTurn();assert.equal(c.hiredThisTurn,false)});
