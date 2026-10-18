const {test}=require('node:test'),assert=require('node:assert/strict');
const {fixture}=require('./clock.cjs');
test('229 turn start: ability-name detection, nonstacking lord/employee/copy, fixed money five',async t=>{
 const h=await fixture(t);h.run("renderGame=()=>{};resolveReactiveRolls=()=>{};resolveTurnStartEffects=()=>{};runRuleHook=()=>{};runInstalledPackHooks=()=>{};");
 for(const mode of ['lord','female','employee','copy','granted','none']){
 h.run("characters[0]='P1';employees[0]=[];copiedAbility=null;powers[0]={y:0,p:0,r:0};"+(mode==='lord'?"characters[0]='P3';employees[0]=[applyUniqueAbilityDef({...CAST_TYPES.CUR2})]":mode==='female'?"characters[0]='P4'":mode==='employee'?"employees[0]=[applyUniqueAbilityDef({...CAST_TYPES.CUR2})]":mode==='copy'?"copiedAbility='等価交換'":mode==='granted'?"employees[0]=[applyUniqueAbilityDef({id:'future',grantedAbilities:['等価交換']})]":""));
 h.run('continueBeginTurn()');assert.equal(h.run('powers[0].y'),mode==='none'?0:5);assert.equal(h.run('powers[0].p+powers[0].r'),0);
 }
});
