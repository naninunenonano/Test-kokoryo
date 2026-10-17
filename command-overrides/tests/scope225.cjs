const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto'),acorn=require('acorn');
const {assemble}=require('../tools/build.cjs'),base=require('./fixtures/scope_225.json'),root=path.resolve(__dirname,'..');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex'),norm=s=>s.replace(/0\.3\.\d+/g,'VERSION');
test('226 scope: only specified balance data, payments, effects, UI and synchronized continuations differ from Ver225',()=>{
 const code=assemble().code,p=acorn.parse(code,{ecmaVersion:'latest'}),nodes=[...p.body[0].expression.callee.body.body,...p.body.slice(1)];
 const now=nodes.map(n=>({name:n.id?.name||n.declarations?.map(d=>d.id.name).join(',')||'',hash:sha(norm(code.slice(n.start,n.end))),start:code.slice(n.start,n.start+80)}));
 const added=new Set(['installEffectStack,installEffectRunning,parkChoiceRevision','BALANCED_INSTALL_COSTS','balancedInstallCost','balancedCostValid','balancedCostChoices','installBalancedCard','renderBalancedInstall','drainInstallEffects']);
 const changed=new Set(['STD_BASE','NORMAL_BASE','LEGEND_CATALOG','normalEffectProgram','playerScaledGain','start','resolveReactiveRolls','legendAllFacesChoices','selectLegendPayment','takeLegend','resolveMayQueen','resolveTurnStartEffects','cardVP','installStandard','installNewNormal','resolveOnInstall','resolveLordMeetingInstall','installLordMeeting','installBlackCasino','installGreaterAcquisition','resumeDeferredInstall','applyOnlineParkPick','renderParkChoice','effectText','costTextForCard','renderCardActions','handCardLikelyInstallable','botCardNeeds','botTryInstall','prepareOnlineGameState','prepareRealMainGame','realMainSnapshot','applyRealMainSnapshot','turnClockRequestPark','turnClockReceivePark']);
 assert.deepEqual(now.filter(n=>!added.has(n.name)).map(n=>n.name),base.records.map(n=>n.name));
 const previous=new Map(base.records.filter(n=>n.name).map(n=>[n.name,n.hash]));
 for(const n of now)if(n.name&&!added.has(n.name)&&!changed.has(n.name))assert.equal(n.hash,previous.get(n.name),n.name);
 const unchanged=n=>!n.name&&!/^NORMAL_BASE\[(1|3|4|5|6|7|8|9|10|11|12|13)\]=/.test(n.start);assert.deepEqual(now.filter(unchanged),base.records.filter(unchanged),'setup/listeners and other anonymous statements');
 for(const [name,h]of Object.entries(base.protectedFiles))assert.equal(sha(fs.readFileSync(path.join(root,name))),h,name);
 const decks=fs.readFileSync(path.join(root,'src/decks.js'),'utf8');for(const card of base.protectedCards)assert.ok(decks.includes(card),card);
});
test('226 HTML layout/defaults and script order are unchanged except version',()=>{
 assert.equal(sha(norm(fs.readFileSync(path.join(root,'index.html'),'utf8'))),base.html);
});
