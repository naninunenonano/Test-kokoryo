const {test}=require('node:test'),assert=require('node:assert/strict'),{fixture}=require('./clock.cjs');
test('231 Bot setup pack2 on/off, standard3 and independent pack1; catalogs follow selection',async t=>{
 const h=await fixture(t);h.run('enterBotMatch()');assert.equal(h.run("q('#onlineDebugPack2').disabled"),false);
 h.run("q('#onlineDebugPack2').checked=true;syncOnlineDebugRulesFromUI();populateOnlineDebugDeckPreset();updateBotLobbyRestrictions()");assert.deepEqual(h.read('gameSettings.enabledPacks'),['pack2']);assert.equal(h.run("availableCharacterFamilies().some(f=>f.id==='noel')"),true);assert.equal(h.run("implementedCastPool('N').some(e=>e.id==='CN6')"),true);
 assert.equal(h.run("[...q('#onlineDebugDeckPreset').options].find(o=>o.value==='standard3').disabled"),false);
 h.run("gameSettings.deckId='standard3'");assert.ok(h.run("normalCardsForDeck('standard3').some(c=>c.packId==='pack2')"));
 h.run("q('#onlineDebugPack2').checked=false;q('#onlineDebugPack1').checked=true;syncOnlineDebugRulesFromUI()");assert.deepEqual(h.read('gameSettings.enabledPacks'),['pack1']);assert.equal(h.run("implementedCastPool('N').some(e=>e.id==='CN6')"),false);assert.equal(h.run("availableCharacterFamilies().some(f=>f.id==='noel')"),false);
 h.run("q('#onlineDebugPack1').checked=false;syncOnlineDebugRulesFromUI()");assert.deepEqual(h.read('gameSettings.enabledPacks'),[]);
});
test('231 Bot pack2 install and level-up use common payments and command, no human prompt',async t=>{
 const h=await fixture(t);h.run(`renderGame=()=>{};botMatchMode=true;turn=1;viewer=0;gameSettings.enabledPacks=['pack2'];turnClockState.active=1;employees[1]=[{...CAST_TYPES.CN1}];hands[1]=[{...STD_BASE.find(c=>c.key==='S14'),id:'level'}];powers[1]={y:0,p:5,r:0};dice=[3,4,5].map((value,i)=>({id:i+1,value,used:false}));window.prompt=()=>{throw Error('Bot requested human input')};`);
 assert.equal(h.run('botTryInstall()'),true);assert.equal(h.run('employees[1][0].id'),'CR1');assert.equal(h.run('temporary[1][0].key'),'S14');assert.equal(h.run('powers[1].p'),0);assert.equal(h.run('unusedDice().length'),1);
});
test('231 Bot normal/mimic/CLR fusion, doppel copy and selected abilities never open input',async t=>{
 const h=await fixture(t);h.run("renderGame=()=>{};botMatchMode=true;turn=1;viewer=0;turnClockState.active=1;window.prompt=()=>{throw Error('Bot requested human input')};");
 for(const ids of [['CN1','CN1'],['CN1','CN6'],['CUR1','CUR13']]){h.run(`employees[1]=${JSON.stringify(ids)}.map(id=>({...CAST_TYPES[id]}));fusionUsedThisTurn=false`);assert.equal(h.run('botTryFusion()'),true);assert.equal(h.run('employees[1].length'),1)}
 assert.equal(h.run('employees[1][0].id'),'CLR1');assert.deepEqual(h.read('employees[1][0].grantedAbilities'),['神の贈り物','神の恩恵']);assert.equal(h.run("q('#lrAbilitySelectModal')?.classList.contains('hidden')??true"),true);
 h.run("employees[1]=[{...CAST_TYPES.CN7}];employees[2]=[{...CAST_TYPES.CR1}];viewer=1;cardCommands.run('雇用 レベルアップ 1')");assert.equal(h.run('employees[1][0].copiedFrom'),'CR1');
});
for(const packs of [[],['pack1'],['pack2']])test('231 real Bot draft/start/'+(packs[0]==='pack2'?'victory':'five-round regression')+': '+(packs[0]||'base'),async t=>{
 const h=await fixture(t);h.run(`let __seed=231;Math.random=()=>{__seed=(1664525*__seed+1013904223)>>>0;return __seed/4294967296};enterBotMatch();gameSettings.enabledPacks=${JSON.stringify(packs)};gameSettings.deckId='${packs[0]==='pack2'?'standard3':packs[0]==='pack1'?'standard2':'standard1'}';renderOnlineDebugLobby();openOnlineCharacterScreen();onlineCharSelections=${JSON.stringify(packs[0]==='pack2'?['P1','P19','P21','P23']:['P1','P3','P5','P7'])}.map(charId=>({charId}));startOnlineDraft();`);
 for(let i=0;i<5;i++){h.run("onlineDraftActivePlayer=0;onlineDraftPendingIndex=0;confirmOnlineDraftPick()");h.jump(100);await h.flush()}
 assert.deepEqual(h.read('onlineDraftHands.map(a=>a.length)'),[5,5,5,5]);
 h.run("onlineResourceChoices[0]={y:gameSettings.initialResources,p:0,r:0};onlineResourceActivePlayer=0;confirmOnlineResources();queueBotResources()");h.jump(200);await h.flush();
 assert.equal(h.run("q('#game').classList.contains('hidden')"),false);assert.equal(h.run('onlineResourceConfirmed.every(Boolean)'),true);assert.ok(h.run('playerTurnCounts.some(n=>n>0)'));
 if(packs[0]==='pack2')assert.equal(h.run("[...deck,...market,...hands.flat()].some(c=>c.packId==='pack2')"),true);
 // Keep real turn/choice/victory logic; omit repeated board DOM painting in long simulation.
 h.run('renderGame=()=>{checkEndgameTrigger();renderTurnStart();renderParkChoice()};');
 let ticks=0;for(;ticks<5000&&!h.run('gameEnded');ticks++){
  if(h.run('turn===0&&!turnClockState.ending&&!turnClockState.expiring'))await h.expire();
  h.jump(1000);await h.flush();
  if(packs[0]!=='pack2'&&h.run('playerTurnCounts.every(n=>n>=5)'))break;
  // Human park choices remain human-owned; the scripted player takes the first legal choice.
  if(h.run('pendingParkPlayers.includes(0)'))h.run("let __g=[...groups()];if(__g.length)applyOnlineParkPick(0,__g[0][0]);");
 }
 if(packs[0]==='pack2')assert.equal(h.run('gameEnded'),true,'must reach ordinary victory, not merely startup');else assert.equal(h.run('playerTurnCounts.every(n=>n>=5)'),true);assert.equal(h.run("q('#lrAbilitySelectModal')?.classList.contains('hidden')??true"),true);
 t.diagnostic(JSON.stringify({pack:packs[0]||'base',ticks,turns:h.read('playerTurnCounts'),vp:h.read('Array.from({length:4},(_,p)=>totalVP(p))')}));
});
