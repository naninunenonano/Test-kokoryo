const {test}=require('node:test'),assert=require('node:assert/strict'),{fixture}=require('./clock.cjs');
const expected={
 S5:[1,'🎲1/2＋資金4'],S6:[1,'🎲3/4＋食料4'],S7:[1,'🎲5/6＋兵力4'],S8:[2,'🎲3/4＋資金4＋兵力2'],S10:[2,'🎲1/4＋資金4＋食料2'],
 N1:[1,'🎲任意×1'],N2:[2,'🎲1/6＋資金6'],N3:[1,'🎲2＋🎲5＋食料5'],N4:[3,'🎲1＋🎲2＋資金7'],N5:[3,'🎲3＋🎲4＋食料7'],N6:[3,'🎲5＋🎲6＋兵力7'],N7:[3,'🎲3＋🎲4＋資金4＋兵力3'],N8:[4,'🎲3×3＋食料6'],N9:[3,'🎲6＋兵力7'],N10:[2,'資金8'],N11:[1,'🎲4/5＋食料1＋兵力2'],N12:[3,'🎲2＋🎲5＋資金3＋食料3＋兵力3'],N13:[4,'🎲ANY×3＋資金7＋食料5'],N14:[1,'🎲ANY＋資金1＋食料1＋兵力1'],
 LL1:[6,'🎲1/2のいずれか×3＋資金12'],LL2:[6,'🎲3/4のいずれか×3＋食料12'],LL3:[6,'🎲5/6のいずれか×3＋兵力12'],LL4:[4,'🎲ANY×3＋資金15'],LL5:[8,'🎲1〜6のうち異なる4種類を各1個＋資金4＋食料4＋兵力4'],LL6:[5,'🎲ANY×4＋資金6＋食料6＋兵力6'],LU1:[-8,'🎲2/3/4/5の同じ出目×6'],LU2:[8,'🎲2×3＋資金12'],LU4:[5,'資金18'],LU5:[8,'ターン開始時に特殊獲得'],LU6:[8,'🎲1〜6のうち異なる4種類を各1個＋資金4＋食料4＋兵力4']};
const supply=`deck=Array.from({length:100},(_,i)=>({id:'n'+i,key:'K'+i,name:'card'+i,type:'N',vp:0}));breadDeck=Array.from({length:100},(_,i)=>({id:'b'+i,value:i%6+1}));`;
async function setup(t){const h=await fixture(t);h.run(`renderGame=()=>{};alert=()=>{};${supply}window.__card=k=>({...STD_BASE.find(c=>c.key===k)||NORMAL_BASE.find(c=>c.key===k)||LEGEND_CATALOG.find(c=>c.id===k),id:k+'-test'});`);return h}
for(const [key,[vp,cost]]of Object.entries(expected))test('226 '+key+': catalog VP, cost, effect text and actual card view agree',async t=>{
 const h=await setup(t);h.run(`window.__c=window.__card('${key}')`);assert.equal(h.run('__c.vp'),vp);assert.equal(h.run('costTextForCard(__c)'),cost);assert.ok(h.run('effectText(__c).length')>10);assert.equal(h.run('cardVP(__c,0)'),vp);const text=h.run('cardInfoSections(__c).textContent');assert.ok(text.includes(cost),text);assert.ok(text.includes(String(vp)),text);
});
test('226 all balanced costs: exact resources, mixed dice/sheets, ANY, distinct objects; rejected payment is atomic',async t=>{
 const h=await setup(t);const costs=h.read('BALANCED_INSTALL_COSTS');
 for(const special of Object.keys(costs))for(const method of ['dice','sheets','mixed']){
  const spec=costs[special],faces=spec.faces.map(v=>Array.isArray(v)?v[0]:v||6);
  h.run(`hands[0]=[{id:'pay',name:'pay',special:'${special}'}];temporary[0]=[];installed[0]=[];installEffectStack=[];pendingParkPlayers=[];powers[0]={y:30,p:30,r:30};dice=[];breadHands[0]=[];`);
  const choices=[];faces.forEach((face,i)=>{
   if(method==='dice'||method==='mixed'&&i%2===0){h.run(`dice.push({id:${i+1},value:${face},used:false})`);choices.push('d:'+(i+1))}
   else{const index=h.run('breadHands[0].length');h.run(`breadHands[0].push({id:'pay${i}',value:${i%2===0?"'any'":face}})`);choices.push('b:'+index)}
  });
  assert.equal(h.run('handCardLikelyInstallable(hands[0][0])'),true,special+method);
  assert.equal(h.run('installBalancedCard(0,'+JSON.stringify(choices)+')'),true,special+method);
  for(const k of ['y','p','r'])assert.equal(h.run('powers[0].'+k),30-(spec.resources[k]||0),special+k);
  assert.equal(h.run("dice.every(d=>d.used)"),true);assert.equal(h.run("breadHands[0].some(b=>b.id.startsWith('pay'))"),false);
  h.run(`hands[0]=[{special:'${special}'}];powers[0]={y:0,p:0,r:0};dice=[{id:9,value:1,used:false}];breadHands[0]=[{id:'keep',value:'any'}]`);
  const before=h.read('({hands,dice,powers,breadHands})');assert.equal(h.run("installBalancedCard(0,['b:0'])"),false);assert.deepEqual(h.read('({hands,dice,powers,breadHands})'),before);
 }
});
test('226 upgrade: only confirmed base can waive dice; resources are still charged and temporary card does not earn start income',async t=>{
 const h=await setup(t);for(const [key,base,k,amount]of [['N4','S5','y',7],['N5','S6','p',7],['N6','S7','r',7],['N7','S8','y',4]]){
  h.run(`hands[0]=[__card('${key}')];installed[0]=[__card('${base}')];temporary[0]=[];powers[0]={y:20,p:20,r:20};dice=[];`);
  assert.equal(h.run('handCardLikelyInstallable(hands[0][0])'),true);assert.equal(h.run('installBalancedCard(0,[],0)'),true);assert.equal(h.run('powers[0].'+k),20-amount);assert.equal(h.run('installed[0].length'),0);assert.equal(h.run('temporary[0].length'),1);
  const before=h.read('powers[0]');h.run('resolveTurnStartEffects()');assert.deepEqual(h.read('powers[0]'),before);
  h.run(`hands[0]=[__card('${key}')];installed[0]=[]`);assert.equal(h.run('installBalancedCard(0,[],0)'),false);
 }
});
test('226 S/N facilities: exact start and cast income/draw; S-only boosts and live VP after moves/upgrades',async t=>{
 const h=await setup(t);
 for(const [base,greater,legend,k]of [['S5','N4','LL1','y'],['S6','N5','LL2','p'],['S7','N6','LL3','r']]){
  h.run(`installed[0]=[__card('${base}'),__card('${greater}')];temporary[0]=[];powers[0]={y:0,p:0,r:0};resolveTurnStartEffects()`);assert.equal(h.run('powers[0].'+k),8);
  h.run(`installed[0].push(__card('${legend}'));powers[0]={y:0,p:0,r:0};resolveTurnStartEffects()`);assert.equal(h.run('powers[0].'+k),11);assert.equal(h.run('cardVP(installed[0][0],0)'),4);assert.equal(h.run('cardVP(installed[0][1],0)'),3);
  h.run(`cardCommands.cast(installed[0][0]);cardCommands.cast(installed[0][1])`);assert.equal(h.run('powers[0].'+k),22);
  h.run(`cardCommands.move(installed[0][0],'installed','discard')`);assert.equal(h.run('cardVP(installed[0][0],0)'),3);assert.equal(h.run('cardVP(installed[0][1],0)'),6);
 }
 h.run(`installed[0]=['S8','N7','S10'].map(__card);breadHands[0]=[];hands[0]=[];resolveTurnStartEffects()`);assert.equal(h.run('breadHands[0].length'),5);assert.equal(h.run('hands[0].length'),2);
 h.run(`for(const c of installed[0])cardCommands.cast(c)`);assert.equal(h.run('breadHands[0].length'),10);assert.equal(h.run('hands[0].length'),4);
});
test('226 N1: two resets, grouped picks and owner order; no refill within a set, empty supply terminates',async t=>{
 const h=await setup(t);for(const owner of [0,2,3]){
  h.run(`${supply}turn=${owner};hands=Array.from({length:4},()=>[]);market=[];discard=[];gameSettings.marketTypes=4;installEffectStack=[];resolveOnInstall(__card('N1'),turn)`);
  for(let set=0;set<2;set++)for(let n=0;n<4;n++){assert.equal(h.run('pendingParkPlayers[0]'),(owner+n)%4);assert.equal(h.run('groups().size'),4-n);h.run('applyOnlineParkPick(pendingParkPlayers[0],market[0].key)')}
  assert.deepEqual(h.read('hands.map(h=>h.length)'),[2,2,2,2]);assert.equal(h.run('pendingParkPlayers.length+installEffectStack.length'),0);
 }
 h.run("deck=[];discard=[];market=[];resolveOnInstall(__card('N1'),0);finishEmptyParkChoices()");assert.equal(h.run('pendingParkPlayers.length+installEffectStack.length'),0);
});
test('226 N2: 5/2 quotas wrap and exhaust stock without duplicate physical command cards',async t=>{
 const h=await setup(t);for(const owner of [0,2,3])for(const total of [0,1,4,7,11,20]){
  h.run(`breadHands=Array.from({length:4},()=>[]);breadDiscard=[];breadDeck=Array.from({length:${total}},(_,i)=>({id:'b'+i,value:1}));resolveLordMeetingInstall(${owner})`);
  let remaining=total;for(let i=0;i<4;i++){const p=(owner+i)%4,n=Math.min(remaining,i===0?5:2);assert.equal(h.run(`breadHands[${p}].length`),n);remaining-=n}
  assert.equal(h.run('new Set(breadHands.flat().map(b=>b.id)).size'),Math.min(total,11));
 }
});
test('226 N3: two sequential free installs, nested Rush and install hooks; recycling and empty supply',async t=>{
 const h=await setup(t);h.run("deck=[__card('N2'),__card('N2')];discard=[];temporary[0]=[];breadHands=Array.from({length:4},()=>[]);resolveOnInstall(__card('N3'),0)");assert.equal(h.run('temporary[0].length'),2);assert.equal(h.run('breadHands[0].length'),10);assert.equal(h.run('installEffectStack.length'),0);
 h.run("deck=[__card('N3'),{id:'a',key:'N99'},{id:'b',key:'N98'},{id:'c',key:'N97'}];temporary[0]=[];resolveOnInstall(__card('N3'),0)");assert.deepEqual(h.read('temporary[0].map(c=>c.key)'),['N3','N99','N98','N97']);
 h.run("deck=[];discard=[{id:'recycle'}];temporary[0]=[];resolveOnInstall(__card('N3'),0)");assert.equal(h.run('temporary[0].length'),1);assert.equal(h.run('installEffectStack.length'),0);
 h.run("deck=[];discard=[];temporary[0]=[];resolveOnInstall(__card('N3'),0)");assert.equal(h.run('temporary[0].length'),0);
});
test('226 N3 waits for both N1 sets before the second top card, JSON snapshot can resume',async t=>{
 const h=await setup(t);h.run(`${supply}deck.unshift(__card('N1'));gameSettings.marketTypes=4;market=[];discard=[];resolveOnInstall(__card('N3'),0)`);assert.equal(h.run('temporary[0].length'),1);
 h.run('window.__save=JSON.parse(JSON.stringify(realMainSnapshot()));turnClockAcceptSnapshot=()=>true;saveRealOnlineResume=()=>{};installEffectStack=[];pendingParkPlayers=[];applyRealMainSnapshot(window.__save)');
 for(let i=0;i<8;i++){assert.equal(h.run('temporary[0].length'),1);h.run('applyOnlineParkPick(pendingParkPlayers[0],market[0].key)')}
 assert.equal(h.run('temporary[0].length'),2);assert.equal(h.run('installEffectStack.length'),0);
});
for(const count of [2,3,4,5,6])test('226 '+count+' players: N8–10 per die/copy debt2, N12 and N13 scaled gains and restrictions',async t=>{
 const h=await setup(t),gain=({2:5,3:4,4:3,5:2,6:2})[count];
 h.run(`playerCount=${count};characters=Array(playerCount).fill('P1');employees=Array.from({length:playerCount},()=>[]);hands=Array.from({length:playerCount},()=>[]);temporary=Array.from({length:playerCount},()=>[]);commandCounts=Array(playerCount).fill(0);powers=Array.from({length:playerCount},()=>({y:0,p:0,r:0}));installed=Array.from({length:playerCount},()=>[]);window.__debtRule=canAcquireDebt`);
 for(const [key,face,color]of [['N8',3,'p'],['N9',6,'r'],['N10',1,'y']]){
  h.run(`installed[1]=[__card('${key}'),__card('${key}')];dice=Array.from({length:5},(_,i)=>({id:i+1,value:${face},used:false}));commandCounts[0]=0;komePlace=100;powers[1]={y:0,p:0,r:0};resolveReactiveRolls()`);assert.equal(h.run('commandCounts[0]'),20);assert.equal(h.run('powers[1].'+color),10*gain);
  h.run('endgameStarter=0;commandCounts[0]=0;resolveReactiveRolls()');assert.equal(h.run('commandCounts[0]'),0);h.run('endgameStarter=null;canAcquireDebt=()=>false;resolveReactiveRolls()');assert.equal(h.run('commandCounts[0]'),0);h.run('canAcquireDebt=window.__debtRule');
 }
 h.run("installed[1]=[__card('N12'),__card('N12')];powers[1]={y:0,p:0,r:0};triggerLandGrab(0)");assert.equal(h.run('powers[1].y'),2*gain);
 h.run(`installed[0]=[__card('N13')];installed[1]=[];powers=Array.from({length:playerCount},(_,p)=>({y:p===1?7:8,p:0,r:0}));powers[0]={y:0,p:0,r:0};cardCommands.cast(installed[0][0])`);assert.equal(h.run('powers[0].y'),(count-2)*gain);
});
test('226 all eleven adjusted legends: real takeLegend validates and spends new mixed costs',async t=>{
 const h=await setup(t);
 const cases=[['LL1',[1,2,1],{y:12}],['LL2',[3,4,3],{p:12}],['LL3',[5,6,5],{r:12}],['LL4',[1,3,5],{y:15}],['LL5',[1,2,4,6],{y:4,p:4,r:4}],['LL6',[1,1,1,1],{y:6,p:6,r:6}],['LU1',[3,3,3,3,3,3],{}],['LU2',[2,2,2],{y:12}],['LU4',[],{y:18}],['LU6',[2,3,4,5],{y:4,p:4,r:4}]];
 for(const [key,faces,res]of cases){
  h.run(`legends=[{...LEGEND_CATALOG.find(c=>c.id==='${key}'),unlocked:true}];legendTakenThisTurn=false;gameEnded=false;installed=Array.from({length:4},()=>[]);temporary=Array.from({length:4},()=>[]);powers[0]={y:30,p:30,r:30};hands=Array.from({length:4},()=>[]);breadHands=Array.from({length:4},()=>[]);employees[1]=[{id:'steal',rarity:'N',name:'worker'}];dice=[];turnClockPrompt=()=>1;chooseNamedHireForLegend=()=>{};finishGame=()=>{gameEnded=true};window.__selected=[];`);
  faces.forEach((value,i)=>h.run(i%2===0?`dice.push({id:${i+1},value:${value},used:false})`:`breadHands[0].push({id:'order${i}',value:${value}})`));
  h.run("selectLegendPayment=async(L,mode,n,face)=>{window.__selected.push([mode,n,face]);return (mode==='faces'?legendCostChoices(L):mode==='same'?legendSameFaceChoices(face):mode==='distinct'?legendAllFacesChoices(n):legendAnyChoices()).slice(0,n)}");
  await h.run(`takeLegend('${key}')`);assert.equal(h.run('legends[0].taken'),true,key);assert.equal(h.run('temporary[0][0].vp'),expected[key][0],key);
  for(const color of ['y','p','r'])assert.equal(h.run('powers[0].'+color),30-(res[color]||0),key+color);
  assert.equal(h.run('dice.every(d=>d.used)'),true,key);if(key!=='LL6')assert.equal(h.run('breadHands[0].length'),0,key);
  if(key==='LU1')assert.equal(h.run('gameEnded'),true);
 }
 h.run("legends=[{...LEGEND_CATALOG.find(c=>c.id==='LU5'),unlocked:true}];legendTakenThisTurn=false;turnClockConfirm=()=>true;window.__ended=0;completeEnd=()=>window.__ended++;offerFreeResourceWipeLegend()");assert.equal(h.run('temporary[0].at(-1).vp'),8);assert.equal(h.run('window.__ended'),1);assert.deepEqual(h.read('powers[0]'),{y:0,p:0,r:0});
});
for(const key of ['LL5','LU6'])test('226 '+key+': real payment modal rejects four identical faces, accepts four distinct mixed faces or ANY substitution',async t=>{
 const h=await setup(t);h.run(`dice=[1,1,1,1,2,4].map((value,i)=>({id:i+1,value,used:false}));breadHands[0]=[{id:'six',value:6}];window.__pay=selectLegendPayment(LEGEND_CATALOG.find(c=>c.id==='${key}'),'distinct',4)`);
 const buttons=[...h.dom.window.document.querySelectorAll('[data-turn-clock-payment] button')],confirm=buttons.find(b=>b.textContent==='選択したコストで獲得');buttons.slice(0,4).forEach(b=>b.click());assert.equal(confirm.disabled,true);buttons.slice(1,4).forEach(b=>b.click());[4,5,6].forEach(i=>buttons[i].click());assert.equal(confirm.disabled,false);confirm.click();assert.equal((await h.run('window.__pay')).length,4);
 h.run("dice=[1,1,1,1].map((value,i)=>({id:i+1,value,used:false}));breadHands[0]=[]");assert.equal(h.run('legendAllFacesChoices(4)'),null);h.run("breadHands[0]=[2,4,'any'].map((value,i)=>({id:'w'+i,value}))");assert.equal(h.run('legendAllFacesChoices(4).length'),4);
});
test('226 LU1: only six equal 2–5; five dice, mixed faces and six ones rejected without payment',async t=>{
 const h=await setup(t);for(const faces of [[2,2,2,2,2],[2,2,2,3,3,3],[1,1,1,1,1,1]]){
  h.run(`dice=${JSON.stringify(faces)}.map((value,i)=>({id:i+1,value,used:false}));breadHands[0]=[];legends=[{...LEGEND_CATALOG.find(c=>c.id==='LU1'),unlocked:true}];legendTakenThisTurn=false;`);await h.run("takeLegend('LU1')");assert.equal(h.run('dice.some(d=>d.used)'),false);assert.equal(h.run('legends[0].taken||false'),false);
 }
});
test('226 UI and Bot share costs, discounts and upgrade path; other presets use the updated card records',async t=>{
 const h=await setup(t);h.run("hands[0]=[__card('N4')];installed[0]=[__card('S5')];temporary[0]=[];dice=[];powers[0]={y:7,p:0,r:0};renderBalancedInstall(q('#handactions'),{c:hands[0][0],i:0})");const button=h.dom.window.document.querySelector('#handactions button');assert.equal(button.disabled,false);button.click();assert.equal(h.run('powers[0].y'),0);assert.equal(h.run('temporary[0][0].key'),'N4');
 h.run("hands[0]=[__card('S5')];temporary[0]=[];powers[0]={y:4,p:0,r:0};characters[0]='P7';dice=[]");assert.equal(h.run('botTryInstall()'),true);assert.equal(h.run('powers[0].y'),0);
 for(const id of ['standard1','standard2','standard3','custom']){h.run(`gameSettings.enabledPacks=['pack1','pack2'];window.__deck=normalCardsForDeck('${id}')`);for(const key of ['N2','N4','N8','N9','N10','N11','N12','N13','N14'])if(h.run(`__deck.some(c=>c.key==='${key}')`))assert.equal(h.run(`__deck.find(c=>c.key==='${key}').vp`),expected[key][0])}
});
