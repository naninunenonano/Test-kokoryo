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
