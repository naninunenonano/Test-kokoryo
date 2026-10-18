const {test}=require('node:test'),assert=require('node:assert/strict');
const {fixture}=require('./clock.cjs');
test('229 turn start: ability-name detection, nonstacking lord/employee/copy, fixed money five',async t=>{
 const h=await fixture(t);h.run("renderGame=()=>{};resolveReactiveRolls=()=>{};resolveTurnStartEffects=()=>{};runRuleHook=()=>{};runInstalledPackHooks=()=>{};");
 for(const mode of ['lord','female','employee','copy','granted','none']){
 h.run("characters[0]='P1';employees[0]=[];copiedAbility=null;powers[0]={y:0,p:0,r:0};"+(mode==='lord'?"characters[0]='P3';employees[0]=[applyUniqueAbilityDef({...CAST_TYPES.CUR2})]":mode==='female'?"characters[0]='P4'":mode==='employee'?"employees[0]=[applyUniqueAbilityDef({...CAST_TYPES.CUR2})]":mode==='copy'?"copiedAbility='等価交換'":mode==='granted'?"employees[0]=[applyUniqueAbilityDef({id:'future',grantedAbilities:['等価交換']})]":""));
 h.run('continueBeginTurn()');assert.equal(h.run('powers[0].y'),mode==='none'?0:5);assert.equal(h.run('powers[0].p+powers[0].r'),0);
 }
});

test('229 cost: exact mixed total, failed payment atomic, nonholder unchanged',async t=>{
 const h=await fixture(t);h.run("characters[0]='P3';powers[0]={y:0,p:2,r:1}");
 assert.equal(h.run('canPayResourceCost({y:3})'),true);assert.equal(h.run('payResourceCost({y:4})'),false);assert.deepEqual(h.read('powers[0]'),{y:0,p:2,r:1});
 assert.equal(h.run('payResourceCost({y:3})'),true);assert.deepEqual(h.read('powers[0]'),{y:0,p:0,r:0});
 h.run("characters[0]='P1';powers[0]={y:0,p:9,r:9}");assert.equal(h.run('payResourceCost({y:3})'),false);
});
test('229 cost: balanced install shares availability and payment, dice/sheets still required',async t=>{
 const h=await fixture(t);h.run("renderGame=()=>{};characters[0]='P3';powers[0]={y:0,p:4,r:0};hands[0]=[{id:'mine',key:'S5',type:'S',special:'mine'}];dice=[{id:1,value:1,used:false}]");
 assert.equal(h.run('handCardLikelyInstallable(hands[0][0])'),true);assert.equal(h.run('installBalancedCard(0,[])'),false);assert.equal(h.run("installBalancedCard(0,['d:1'])"),true);assert.deepEqual(h.read('powers[0]'),{y:0,p:0,r:0});assert.equal(h.run('dice[0].used'),true);
});
test('229 Bot and pack costs use the same payment without changing forced losses',async t=>{
 const h=await fixture(t);h.run("renderGame=()=>{};botLog=()=>{};characters[0]='P3';powers[0]={y:2,p:2,r:0};hands[0]=[{id:'mine',key:'S5',type:'S',special:'mine'}];dice=[{id:1,value:1,used:false}]");
 assert.equal(h.run('botTryInstall()'),true);assert.equal(h.run('powers[0].y+powers[0].p+powers[0].r'),0);
 h.run('powers[0]={y:0,p:2,r:0}');assert.equal(h.run('packRuntimeApi(0).payResources(0,{r:1})'),true);assert.equal(h.run("packRuntimeApi(0).resource(0,'r',-1)"),false);assert.equal(h.run('powers[0].p'),1);
});

test('229 start: prohibition bypass, coexisting finance/strategist, copied and hired ability',async t=>{
 const h=await fixture(t);h.run("renderGame=()=>{};resolveReactiveRolls=()=>{};runRuleHook=()=>{};runInstalledPackHooks=()=>{};resolveTurnStartEffects=()=>{};");
 for(const mode of ['lord','employee','copy']){
 h.run("characters[0]='P5';employees[0]=[{financeIncome:{self:2,others:0,debt:0}}];copiedAbility=null;powers[0]={y:0,p:0,r:0};installed[0]=[{type:'LEGEND',special:'goldenAge',_eraAcquiredThisTurn:true,specialConfig:{resourceGain:{ownerBlock:['y','p','r'],acquireTurnAllSources:true}}}];"+(mode==='lord'?"characters[0]='P3'":mode==='employee'?"employees[0].push(applyUniqueAbilityDef({...CAST_TYPES.CUR2}))":"copiedAbility='等価交換'"));
 h.run('continueBeginTurn()');assert.equal(h.run('powers[0].y'),7);assert.equal(h.run("gainResource(0,'p',2)"),2);
 }
});
test('229 all resource acquisition paths and restrictions use the same effective ability',async t=>{
 const h=await fixture(t);h.run("renderGame=()=>{};characters[0]='P3';installed[0]=[{type:'LEGEND',special:'goldenAge',_eraAcquiredThisTurn:true},{type:'LEGEND',special:'greatDepression',_eraAcquiredThisTurn:true}];dice=[1,3,5].map((value,i)=>({id:i+1,value,used:false}));breadHands[0]=[1,3,5].map((value,i)=>({id:'b'+i,value}));");
 for(let i=1;i<=3;i++)assert.equal(h.run(`cardCommands.change('convert',3,{dieId:${i}}).amount`),3);
 for(let i=0;i<3;i++)assert.equal(h.run("cardCommands.change('convert',2,{kind:'command',index:0}).amount"),2);
 for(const k of ['y','p','r']){assert.equal(h.run(`packRuntimeApi(0).resource(0,'${k}',2)`),true);assert.equal(h.run(`cardCommands.pool('${k}',1)`),1);}
 assert.deepEqual(h.read('powers[0]'),{y:8,p:8,r:8});
 h.run("characters[0]='P1'");for(const k of ['y','p','r'])assert.equal(h.run(`gainResource(0,'${k}',2)`),0);
});
test('229 depression acquisition keeps non-resource restrictions on dice, allows only resource bypass',async t=>{
 const h=await fixture(t);h.run("renderGame=()=>{};resolveReactiveRolls=()=>{};characters[0]='P3';installed[0]=[{type:'LEGEND',special:'greatDepression',_eraAcquiredThisTurn:true}];continueBeginTurn()");
 assert.equal(h.run('dice.length'),0);assert.equal(h.run('pendingSSRBonus'),0);assert.equal(h.run('pendingLordResource'),3);assert.equal(h.run('powers[0].y'),5);h.run("gainLordResource('y')");assert.equal(h.run('powers[0].y'),6);
});
test('229 VP displayed card values sum to global optimum and victory trigger; cache refreshes after changes',async t=>{
 const h=await fixture(t);h.run("characters[0]='P3';powers[0]={y:0,p:6,r:0};installed[0]=['boom','recession'].map((special,i)=>({id:'v'+i,type:'LEGEND',special,specialConfig:{vpFormula:{resources:[i?'p':'y'],divisor:6,round:'ceil'}}}));gameSettings.winVP=2;renderGame()");
 assert.equal(h.run('totalVP(0)'),2);assert.equal(h.run('installed[0].reduce((n,c)=>n+cardVP(c,0),0)'),2);assert.equal(h.dom.window.document.querySelector('#currentvp').textContent,'2');h.run('checkEndgameTrigger()');assert.equal(h.run('endgameStarter'),0);
 h.run('powers[0].p=1');assert.equal(h.run('totalVP(0)'),1);h.run('powers[0].p=0');assert.equal(h.run('totalVP(0)'),0);h.run("characters[0]='P1';powers[0]={y:6,p:6,r:0}");assert.equal(h.run('totalVP(0)'),2);
});
test('229 VP includes negative shortfalls, guild/spirit, debt bonuses and temporary cards without spending',async t=>{
 const h=await fixture(t);h.run("characters[0]='P3';powers[0]={y:1,p:1,r:1};installed[0]=[{id:'a',type:'N',special:'naroppaGuild'}];temporary[0]=[{id:'b',type:'N',special:'inadamashii'}]");assert.equal(h.run('totalVP(0)'),1);assert.deepEqual(h.read('powers[0]'),{y:1,p:1,r:1});
 h.run("installed[0]=[{id:'d',type:'LEGEND',special:'greatDepression'}];temporary[0]=[];powers[0]={y:0,p:0,r:0};commandCounts[0]=11");assert.equal(h.run('totalVP(0)'),-8);
});
test('229 UI and actual payment reject reused totals for multi-resource costs; keep ordinary exchange 1:1',async t=>{
 const h=await fixture(t);h.run("characters[0]='P3';powers[0]={y:0,p:2,r:0};dice=[{id:1,value:1,used:false}];hands[0]=[{id:'x',key:'N14',type:'N',special:'publicmarket',name:'交易場',costText:'test'}];renderCardActions()");
 const buttons=[...h.dom.window.document.querySelectorAll('#handactions button')];assert.equal(buttons.at(-1).disabled,true);
 assert.equal(h.run('exchangeRateFor()'),1);h.run("characters[0]='P1'");assert.equal(h.run('exchangeRateFor()'),3);
});
test('229 ability copy metadata, nonstacking, enabled gate and off-turn employee detection remain coherent',async t=>{
 const h=await fixture(t);assert.equal(h.run("UNIQUE_ABILITY_DEFS['等価交換'].stackable"),false);assert.equal(h.run("abilityProfile('等価交換').uncopyable===true"),false);
 h.run("employees[1]=[applyUniqueAbilityDef({...CAST_TYPES.CUR2})]");assert.equal(h.run('hasEquivalentExchange(1)'),true);h.run('employeeUniqueAbilitiesEnabled=()=>false');assert.equal(h.run('hasEquivalentExchange(1)'),false);
});
test('229 serialized online resume restores holder, copies, mixed payments and optimized VP',async t=>{
 const host=await fixture(t),guest=await fixture(t);for(const [i,h] of [host,guest].entries())h.run(`realOnlineMainMode=true;debugLocalMode=false;realLobbyPhase='main';realLobbyClientId='p${i}';realLobbyHostId='p0';viewer=${i};realMainRoster=[0,1,2,3].map(p=>({client_id:'p'+p,name:'P'+p,charId:'P1'}));realLobbyChannel={send:()=>Promise.resolve('ok')};turn=0;turnClockState.active=0;`);
 host.run("turnClockInitializeAuthority();turnClockNet.initial=false;characters[0]='P1';copiedAbility='等価交換';powers[0]={y:0,p:4,r:3};installed[0]=[{id:'g',type:'N',special:'naroppaGuild'}];");
 const state=host.read('realMainSnapshot()');guest.run('applyRealMainSnapshot('+JSON.stringify(state)+')');assert.equal(guest.run('hasEquivalentExchange(0)'),true);assert.equal(guest.run('totalVP(0)'),host.run('totalVP(0)'));assert.equal(guest.run('payResourceCost({y:3},0)'),true);assert.equal(guest.run('powers[0].y+powers[0].p+powers[0].r'),4);
});
