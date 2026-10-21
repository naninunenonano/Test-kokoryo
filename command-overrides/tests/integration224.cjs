const {test}=require('node:test'),assert=require('node:assert/strict');
const {fixture}=require('./clock.cjs');
const fs=require('fs'),acorn=require('acorn');
const supply=`deck=Array.from({length:100},(_,i)=>({id:'c'+i,key:'K'+i,name:'card'+i,type:'N',vp:1}));breadDeck=Array.from({length:100},(_,i)=>({id:'b'+i,value:i%6+1}));`;
const quiet=`renderGame=()=>{};window.__alerts=[];alert=x=>window.__alerts.push(x);`;
async function setup(t){const h=await fixture(t);h.run(quiet+supply);return h}
test('224 registry: lowercase commands and exact single the end dispatch; Pack API binds owner',async t=>{
 const h=await setup(t);assert.equal(h.run("Object.keys(cardCommands).every(n=>/^[a-z]+(?: [a-z]+)?$/.test(n))"),true);
 for(const name of ['repeat','boost','function','cast','copy','remove','discount','end','the end','koyou'])assert.equal(h.run(`typeof cardCommands['${name}']`),'function');
 h.run("packRuntimeApi(2).commands.pool('p',4);packRuntimeApi(2).commands.draw('deck',2);powers[2].y=6;packRuntimeApi(2).commands.change('exchange',{from:'y',to:'r'})");
 assert.deepEqual(h.read('powers[2]'),{y:3,p:4,r:1});assert.equal(h.run('hands[2].length'),2);assert.equal(h.run('hands[0].length'),0);
 assert.throws(()=>h.run("packRuntimeApi(2).commands.dice('roll')"),/active player/);
 assert.throws(()=>h.run("cardCommands.run('the')"),/Unknown command/);
 h.run("window.__ends=[];finishGame=()=>window.__ends.push('game');completeEnd=()=>window.__ends.push('turn');cardCommands.run('  the   end  ');cardCommands.run('end')");assert.deepEqual(h.read('window.__ends'),['game','turn']);
});
test('224 change: six faces give three, sheets give two; invalid/stale changes and undo are atomic',async t=>{
 const h=await setup(t);h.run("dice=[1,2,3,4,5,6].map((value,i)=>({id:i+1,value,used:false}));breadHands[0]=[{id:'o',value:1}];");
 for(let i=1;i<=6;i++)assert.equal(h.run(`cardCommands.change('convert',3,{dieId:${i},undo:true}).amount`),3);
 assert.deepEqual(h.read('powers[0]'),{y:6,p:6,r:6});assert.equal(h.run("cardCommands.change('convert',3,{dieId:1}).ok"),false);
 assert.equal(h.run("cardCommands.change('convert',3,{kind:'command',index:0,undo:true}).amount"),2);
 h.run('undoCommandAction(commandUndoHistory.at(-1).id)');assert.equal(h.run('powers[0].y'),6);assert.equal(h.run('breadHands[0][0].id'),'o');
 h.run("dice.push({id:7,value:3,used:false})");assert.equal(h.run("cardCommands.change('convert',3,{dieId:7,color:'r'}).ok"),false);assert.equal(h.run('dice.at(-1).used'),false);
});
test('224 exchange: 3:1, shared 1:1 for lord/employee/copy, no cost on invalid selection',async t=>{
 const h=await setup(t);h.run("powers[0]={y:12,p:0,r:0};cardCommands.change('exchange',{from:'y',to:'p',undo:true})");assert.deepEqual(h.read('powers[0]'),{y:9,p:1,r:0});
 for(const type of ['lord','employee','copy']){
  h.run("characters[0]='P1';employees[0]=[];copiedAbility=null;"+(type==='lord'?"characters[0]='P3'":type==='employee'?"employees[0]=[applyUniqueAbilityDef({...CAST_TYPES.CUR2})]":"copiedAbility='等価交換'"));
  assert.equal(h.run('exchangeRateFor()'),1);assert.equal(h.run("cardCommands.change('exchange',{from:'y',to:'r'}).spent"),1);
 }
 const before=h.read('powers[0]');assert.equal(h.run("cardCommands.change('exchange',{from:'y',to:'y'}).ok"),false);assert.deepEqual(h.read('powers[0]'),before);
});
test('224 blessing: five per die, two per sheet, additive sources and copied bonus without initial effects',async t=>{
 const h=await setup(t);h.run("employees[0]=[applyUniqueAbilityDef({id:'b',uniqueAbility:'神の恩恵'})];dice=[{id:1,value:1,used:false}];breadHands[0]=[{id:'order',value:1}]");
 assert.equal(h.run("cardCommands.change('convert',3,{dieId:1,color:'r'}).amount"),5);
 assert.equal(h.run("cardCommands.change('convert',3,{kind:'command',index:0}).amount"),2);
 h.run("cardCommands.copy('神の恩恵');dice.push({id:2,value:1,used:false})");assert.equal(h.run("cardCommands.change('convert',3,{dieId:2,color:'p'}).amount"),7);
 assert.equal(h.run("cardCommands.copy('オーバークロック')"),false);assert.equal(h.run("Object.hasOwn(cardCommands.copy('神算鬼謀'),'firstBreadBonus')"),false);
});
test('224 repeat: serial waiting, exactly-once next, arbitrary non-card body',async t=>{
 const h=await setup(t);h.run("window.__seen=[];window.__next=null;cardCommands.repeat(3,{step:(i,next)=>{window.__seen.push(i);window.__next=next},done:()=>window.__seen.push('done')});window.__first=window.__next");
 assert.deepEqual(h.read('window.__seen'),[0]);h.run('window.__first();window.__first()');assert.deepEqual(h.read('window.__seen'),[0,1]);h.run('window.__next();window.__next()');assert.deepEqual(h.read('window.__seen'),[0,1,2,'done']);
});
test('224 move/toba: no install hook on movement; free install runs hooks and becomes temporary',async t=>{
 const h=await setup(t);h.run("hands[0]=[{id:'plain',special:'lordmeeting',type:'N',name:'meeting'}];cardCommands.move(hands[0][0],'hand','temporary')");assert.equal(h.run('breadHands.flat().length'),0);
 h.run("cardCommands.move(temporary[0][0],'temporary','hand');cardCommands.toba({card:hands[0][0],from:'hand'})");assert.equal(h.run('temporary[0][0].id'),'plain');assert.equal(h.run('breadHands[0].length'),5);assert.equal(h.run('breadHands[1].length'),2);
});
test('224 discount: install availability and actual cost use common discount; separate sources stack as before',async t=>{
 const h=await setup(t);h.run("characters[0]='P7';powers[0]={y:10,p:10,r:10};hands[0]=[{id:'free',key:'N1',name:'park',type:'N',special:'paneteria'}];");
 assert.equal(h.run('lordInstallDiceDiscount()'),1);assert.equal(h.run("handCardLikelyInstallable(hands[0][0])"),true);assert.equal(h.run("installCostOptions(null).some(c=>c.id==='free:request:0')"),true);
 h.run("installPaneteria(0,'free:request:0')");assert.equal(h.run('temporary[0].length'),1);assert.equal(h.run('dice.length'),0);
 h.run("employees[0]=[applyUniqueAbilityDef({...CAST_TYPES.CUR3})]");assert.equal(h.run('lordInstallDiceDiscount()'),2);
 assert.equal(h.run("cardCommands.discount('install','dice',1,{remaining:2})"),1);
});
test('224 LL1–LL3: boosts and VP follow live installed/temporary board without accumulation',async t=>{
 const h=await setup(t);
 for(const [base,legend,key]of [['mine','legendmine','y'],['farm','legendfarm','p'],['barracks','legendbarracks','r']]){
  h.run(`installed[0]=[{id:'base',special:'${base}',vp:2},{id:'legend',special:'${legend}',vp:5}];temporary[0]=[];discard=[];powers[0]={y:0,p:0,r:0};resolveTurnStartEffects()`);
  assert.equal(h.run(`powers[0].${key}`),6);assert.equal(h.run('cardVP(installed[0][0],0)'),5);
  h.run('cardCommands.move(installed[0][1],"installed","discard")');assert.equal(h.run('cardVP(installed[0][0],0)'),2);
  assert.equal(h.run("cardCommands.function({target:'discard',where:c=>c.id==='legend',value:c=>c.vp})"),5);
 }
});
test('224 LL4: select hire includes normal rarities, excludes CLR, honors capacity and clones choice',async t=>{
 const h=await setup(t);h.run('chooseNamedHireForLegend()');
 const options=[...h.dom.window.document.querySelector('#effectSelect242').options];assert.ok(options.length>=15);h.run('window.choose242()');assert.equal(h.run('employees[0].length'),1);assert.notEqual(h.run('employees[0][0].rarity'),'CLR');
 h.run('employees[0]=Array.from({length:effectiveHireLimit()},()=>({id:"full"}));chooseNamedHireForLegend()');assert.equal(h.run('employees[0].length'),h.run('effectiveHireLimit()'));
});
test('224 LL5/LL6 differential: selections, destruction, recycling, players and debt match Ver223',async t=>{
 const current=await setup(t),old=await setup(t),legacy=require('./fixtures/legends_223.json');
 for(const [name,code]of Object.entries(legacy))old.run(name+'=('+code+')');
 const state='({hands,breadHands,installed,temporary,powers,discard,deck,breadDiscard,breadDeck,commandCounts,triggerNotices})';
 const scripts=[`turnClockPrompt=()=>null;installed=Array.from({length:4},(_,p)=>[{id:'s'+p,name:'base',type:'S'},{id:'l'+p,name:'legend',type:'LEGEND'}]);temporary[2]=[{id:'temp',name:'temp',type:'N'}];resolveScorchedEarth(2)`,
 `Math.random=()=>0.5;hands=Array.from({length:4},(_,p)=>Array.from({length:p},(_,i)=>({id:p+'n'+i,name:'normal',key:p+'n'+i})));breadHands=Array.from({length:4},(_,p)=>[{id:'bread'+p,value:1}]);commandCounts=[1,2,3,4];resolveGreatRefresh()`];
 for(const script of scripts){for(const h of [current,old])h.run(script);current.run('while(pendingSelections242.length)window.choose242()');assert.deepEqual(current.read(state),old.read(state))}
});
test('224 LU2: each of two Yggdrasil copies offers three independent selections and uses cast',async t=>{
 const h=await setup(t);h.run("installed[0]=[{id:'q1',special:'mayqueen'},{id:'q2',special:'mayqueen'},{id:'mine',special:'mine',name:'mine'}];window.__choice=null;chooseLegendCard=(title,note,opts,choose,cancel)=>window.__choice={opts,choose,cancel};resolveMayQueen()");
 for(let i=0;i<6;i++)h.run('window.__choice.choose(window.__choice.opts[0])');assert.equal(h.run('powers[0].y'),18);assert.deepEqual(h.read('stdAbilityUsed'),{'cast:q1':3,'cast:q2':3});h.run('resolveMayQueen()');assert.equal(h.run('powers[0].y'),18);
});
test('224 LU3: four serial free installs; N1 pick waits before next choice and snapshot can resume',async t=>{
 const h=await setup(t);h.run("gameSettings.marketTypes=4;hands[0]=[{id:'park',key:'N1',type:'N',special:'paneteria',name:'park'},...Array.from({length:3},(_,i)=>({id:'simple'+i,key:'S1',type:'S',name:'plain'}))];window.__choice=null;chooseLegendCard=(title,note,opts,choose,cancel)=>window.__choice={opts,choose,cancel};resolveEggHarp(0);window.__choice.choose(window.__choice.opts[0])");
 assert.equal(h.run('temporary[0].length'),1);assert.equal(h.run('pendingParkPlayers.length'),4);assert.equal(h.run('turnClockChoice.waiting'),'park');
 h.run('turnClockChoice=JSON.parse(JSON.stringify(turnClockChoice));while(pendingParkPlayers.length){if(market.length)applyOnlineParkPick(pendingParkPlayers[0],market[0].key);else finishEmptyParkChoices()}');assert.equal(h.run('turnClockChoice.n'),1);
 for(let i=0;i<3;i++)h.run('window.__choice.choose(window.__choice.opts[0])');assert.equal(h.run('temporary[0].length'),4);assert.equal(h.run('turnClockChoice'),null);
});
test('224 LU4: ownership transfer retains per-instance history and hire limit follows board',async t=>{
 const h=await setup(t);h.run("legends=[{...LEGEND_CATALOG.find(x=>x.id==='LU4'),unlocked:true,taken:false,col:1}];powers[0].y=24;employees[1]=[{id:'CUR4',name:'staff',rarity:'UR',_firstBreadUsed:true,oracleUsedTurn:1}];turnClockPrompt=()=>1;");
 await h.run("takeLegend('LU4')");h.run("window.choose242()");assert.equal(h.run('employees[1].length'),0);assert.equal(h.run('employees[0][0]._firstBreadUsed'),true);assert.equal(h.run('employees[0][0].oracleUsedTurn'),1);assert.equal(h.run('effectiveHireLimit()'),h.run('gameSettings.hireLimit')+1);
});
test('224 LU5: condition gate, free install, all resources removed before one turn end',async t=>{
 const h=await setup(t);h.run("legends=[{...LEGEND_CATALOG.find(x=>x.id==='LU5'),unlocked:true,taken:false,col:2},{id:'lower',tier:'lower',taken:false,col:2}];turnClockConfirm=()=>true;window.__end=0;completeEnd=()=>window.__end++;");
 assert.equal(h.run('offerFreeResourceWipeLegend()'),false);h.run('legends[1].taken=true;powers=Array.from({length:4},()=>({y:9,p:8,r:7}))');assert.equal(h.run('offerFreeResourceWipeLegend()'),true);assert.equal(h.run('window.__end'),1);assert.deepEqual(h.read('powers'),Array.from({length:4},()=>({y:0,p:0,r:0})));assert.equal(h.run('temporary[0][0].special'),'resourceWipe');
});
test('224 LU1 immediate finish is distinct from normal end and clears running clock',async t=>{
 const h=await setup(t);h.run("legends=[{...LEGEND_CATALOG.find(x=>x.id==='LU1'),unlocked:true,taken:false,col:2}];dice=Array.from({length:8},(_,i)=>({id:i+1,value:2,used:false}));selectLegendPayment=async()=>dice.map(d=>({kind:'die',id:d.id}));");
 await h.run("takeLegend('LU1')");assert.equal(h.run('gameEnded'),true);assert.equal(h.run('turn'),0);assert.equal(h.run('turnClockState.active'),null);
});
test('224 CUR1–CUR6 and lords use the same strengthened definitions; common chosen dice stay separate',async t=>{
 const h=await setup(t);
 for(const id of ['CUR1','CUR2','CUR3','CUR4','CUR5','CUR6'])assert.equal(h.run(`CAST_TYPES.${id}.chooseDie`),true);
 for(const name of ['神の贈り物','神算鬼謀','オーバークロック','神の見えざる手'])assert.equal(h.run(`Object.values(CHARACTER_DATA).filter(x=>x.uniqueAbility==='${name}').every(x=>Object.entries(UNIQUE_ABILITY_DEFS['${name}'].props).every(([k,v])=>x[k]===v))`),true);
 h.run("characters[0]='P1';employees[0]=[applyUniqueAbilityDef({...CAST_TYPES.CUR1})];beginTurn()");assert.equal(h.run('dice.length'),7);assert.equal(h.run('pendingLordResource'),6);assert.deepEqual(h.read('pendingCastResourceChoices.map(x=>x.amount)'),[3]);assert.equal(h.run('pendingSSRBonus'),1);
});
test('224 N/R/SR/SSR resource and dice families use common commands without duplicated implementation',async t=>{
 const h=await setup(t);
 for(const id of ['CN1','CN2','CN3','CR1','CR2','CR3','CSR1','CSSR1']){
  h.run(`employees[0]=[applyUniqueAbilityDef({...CAST_TYPES.${id}})];characters[0]='P1';powers[0]={y:0,p:0,r:0};beginTurn()`);
  const e=h.read(`CAST_TYPES.${id}`);if(e.resource)assert.equal(h.run(`powers[0].${e.resource}`),e.amount);
  assert.equal(h.run('pendingSSRBonus'),e.rarity==='SSR'?1:0);assert.equal(h.run('dice.length'),5+(e.rarity==='SSR'?0:1));
 }
});
test('224 once: two strategists and overclocks are independent, JSON retains first flags; copied strategist gets only recurring two',async t=>{
 const h=await setup(t);h.run("characters[0]='P3';employees[0]=[applyUniqueAbilityDef({...CAST_TYPES.CUR4}),applyUniqueAbilityDef({...CAST_TYPES.CUR4}),applyUniqueAbilityDef({...CAST_TYPES.CUR5}),applyUniqueAbilityDef({...CAST_TYPES.CUR5})];beginTurn()");assert.equal(h.run('breadHands[0].length'),12);assert.deepEqual(h.read('pendingOverclockChoices.map(x=>x.remaining)'),[20,20]);
 h.run('employees=JSON.parse(JSON.stringify(employees));pendingOverclockChoices=[];beginTurn()');assert.equal(h.run('breadHands[0].length'),16);assert.equal(h.run('pendingOverclockChoices.length'),0);
 h.run("cardCommands.copy('神算鬼謀',{applyStart:true})");assert.equal(h.run('breadHands[0].length'),18);
});
test('224 overclock twenty can be split across all resources and cannot be granted twice',async t=>{
 const h=await setup(t);h.run("characters[0]='P9';beginTurn();for(let i=0;i<20;i++)gainOverclockResource(i<7?'y':i<15?'p':'r')");assert.deepEqual(h.read('powers[0]'),{y:7,p:8,r:5});assert.equal(h.run('pendingOverclockChoices.length'),0);h.run('beginTurn()');assert.equal(h.run('pendingOverclockChoices.length'),0);
});
test('224 invisible hand draws two per source and discards one for two per source',async t=>{
 const h=await setup(t);h.run("characters[0]='P11';employees[0]=[applyUniqueAbilityDef({...CAST_TYPES.CUR6})];beginTurn()");assert.equal(h.run('hands[0].length'),4);h.run("useInvisibleHand(0,'r')");assert.equal(h.run('hands[0].length'),3);assert.equal(h.run('discard.length'),1);assert.equal(h.run('powers[0].r'),4);
});
test('230 Oracle regression: hand cost replaces dice/money and does not consume normal hire',async t=>{
 const h=await setup(t);h.run("employees[0]=[applyUniqueAbilityDef({id:'oracle1',name:'o1',uniqueAbility:'神託'}),{...CAST_TYPES.CN1}];hands[0]=Array.from({length:6},(_,i)=>({id:'c'+i,type:'N',name:'cost',vp:0}));deck=Array.from({length:8},(_,i)=>({id:'top'+i,type:'N',name:'top',vp:0}));powers[0]={y:0,p:0,r:0};dice=[]");
 assert.equal(h.run("useOracleUpgrade('employee',0,99)"),false);assert.equal(h.run('hands[0].length'),6);assert.equal(h.run("useOracleUpgrade('employee',0,1)"),true);assert.equal(h.run('hands[0].length'),3);assert.equal(h.run('hiredThisTurn'),false);assert.equal(h.run('powers[0].y'),0);
});
test('224 recreation range ±2, dead man start 2+2, Mine abilities enabled and Gold ten VP',async t=>{
 const h=await setup(t);h.run("employees[0]=[applyUniqueAbilityDef({id:'r',uniqueAbility:'リクリエイション'})]");assert.equal(h.run('recreationRangeForTurn()'),2);
 h.run("characters[0]='P3';employees[0]=[applyUniqueAbilityDef({id:'d',uniqueAbility:'デッドマンズトリガー'})];beginTurn()");assert.equal(h.run('hands[0].length'),2);assert.equal(h.run('breadHands[0].length'),2);
 h.run("characters[0]=Object.entries(CHARACTER_DATA).find(([k,x])=>x.name==='マイン')[0];employees[0]=[applyUniqueAbilityDef({id:'CUR8',uniqueAbility:'無限の黄金',vp:5}),applyUniqueAbilityDef({...CAST_TYPES.CUR4})];breadHands[0]=[];beginTurn()");assert.equal(h.run('employeeUniqueAbilitiesEnabled(0)'),true);assert.equal(h.run('breadHands[0].length'),6);assert.equal(h.run('groupedCharacterVP(0)'),20);
});
test('224 confirmed gacha rates: N60 R20 SR11 SSR6 UR3, including UR without packs',async t=>{
 const h=await setup(t);h.run('gameSettings.enabledPacks=[];employees=Array.from({length:4},()=>[])');
 assert.deepEqual(h.read('CAST_GACHA_RATES'),[['N',60],['R',20],['SR',11],['SSR',6],['UR',3]]);
 for(const [r,rolls]of [['N',[0,59.99]],['R',[60,79.99]],['SR',[80,90.99]],['SSR',[91,96.99]],['UR',[97,99.99]]])for(const n of rolls){h.run(`Math.random=()=>${n/100}`);assert.equal(h.run('rollCastRarity()'),r)}
 assert.ok(h.run("implementedCastPool('UR').length")>=6);
});
test('224 actual UI sheet, exchange and market buttons use the shared change costs',async t=>{
 const h=await setup(t);h.run("breadHands[0]=[{id:'b',value:5}];renderConversionActions();q('#breadconvertchoices button').click()");assert.equal(h.run('powers[0].r'),2);
 h.run("powers[0].y=6;pendingResourceFrom=null;renderResourceExchange();q('#resourceexchangechoices button').click();q('#resourceexchangechoices button').click()");assert.deepEqual(h.read('powers[0]'),{y:3,p:1,r:2});
 h.run("powers[0]={y:1,p:1,r:1};gameSettings.marketTypes=3;market=[{id:'old',key:'old'}];q('#refresh').click()");assert.deepEqual(h.read('powers[0]'),{y:0,p:0,r:0});assert.equal(h.run('new Set(market.map(c=>c.key)).size'),3);assert.equal(h.run('gameSettings.marketTypes'),3);
});
test('224 Tribute once: each lord/staff/copy remains independent and movement preserves history',async t=>{
 const h=await setup(t);h.run("employees[0]=[applyUniqueAbilityDef({id:'t1',uniqueAbility:'貢ぎ物'}),applyUniqueAbilityDef({id:'t2',uniqueAbility:'貢ぎ物'})];hands[0]=[{id:'a'},{id:'b'},{id:'c'}];useTributeInstall('employee',0,0);useTributeInstall('employee',0,0);useTributeInstall('employee',1,0)");assert.equal(h.run('temporary[0].length'),2);assert.equal(h.run('breadHands[0].length'),2);assert.equal(h.run('employees[0][0].tributeUsedTurn'),true);
});
test('224 ID-less effect copies receive distinct synchronized identities; stale selections do not cast twice',async t=>{
 const h=await setup(t);h.run("installed[0]=[{special:'mayqueen'},{special:'mayqueen'},{id:'mine',name:'mine',special:'mine'}];resolveMayQueen();window.__oldPick=q('#legendChoiceCards .selectable-card').onclick;window.__oldPick();window.__oldPick()");assert.equal(h.run('powers[0].y'),3);assert.equal(h.run("stdAbilityUsed['cast:'+installed[0][0]._commandId]"),1);
 for(let i=0;i<5;i++)h.run("q('#legendChoiceCards .selectable-card').click()");assert.equal(h.run('powers[0].y'),18);assert.notEqual(h.run('installed[0][0]._commandId'),h.run('installed[0][1]._commandId'));
 h.run('installed=JSON.parse(JSON.stringify(installed))');assert.equal(h.run('Object.keys(stdAbilityUsed).length'),2);
});
test('224 Recreation UI accepts ±2, excludes ±3 and both forms of legend cards',async t=>{
 const h=await setup(t);h.run("characters[0]='P13';installed[0]=[{id:'base',type:'S',vp:3,name:'base'},{key:'LL1',type:'LEGEND',vp:5,name:'legend'}];hands[0]=[{id:'plus2',type:'N',vp:5,name:'plus2'},{id:'plus3',type:'N',vp:6,name:'plus3'},{id:'legend',type:'LEGEND',vp:3,name:'legend'}];useRecreation()");
 assert.equal(h.dom.window.document.querySelectorAll('#recreationPicker select')[0].options.length,1);assert.equal(h.dom.window.document.querySelectorAll('#recreationPicker select')[1].options.length,1);
 h.dom.window.document.querySelector('#recreationPicker button').click();assert.equal(h.run('discard[0].id'),'base');assert.equal(h.run('temporary[0][0].id'),'plus2');assert.equal(h.run('installed[0][0].type'),'LEGEND');
});
