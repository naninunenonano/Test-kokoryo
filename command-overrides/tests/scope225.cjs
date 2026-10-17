const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('fs'),path=require('path'),crypto=require('crypto'),acorn=require('acorn');
const {assemble}=require('../tools/build.cjs'),baseline=require('./fixtures/scope_224.json');
const root=path.resolve(__dirname,'..'),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const normalize=s=>s.replace(/0\.3\.(220|221|222|223|224|225)/g,'VERSION');
test('225 scope: only setup/defaults/draft handlers differ; all commands, abilities and card definitions are frozen',()=>{
 const code=assemble().code,p=acorn.parse(code,{ecmaVersion:'latest'});
 const record=n=>({type:n.type,name:n.id?.name||n.declarations?.map(d=>d.id.name).join(',')||'',hash:sha(normalize(code.slice(n.start,n.end))),start:code.slice(n.start,n.start+100)});
 const current=[...p.body[0].expression.callee.body.body,...p.body.slice(1)].map(record),previous=[...baseline.body,...baseline.epilogue];
 const added=new Set(['DEFAULT_RULE_SETTINGS','INITIAL_DRAFT','ruleSettingValue','initialDraftSetupError','createInitialDraftDeal']);
 const changed=new Set(['gameSettings','fillLegendSlotSelect','start','pick','renderDraft','syncMarketTargetUI','captureLocalRuleSettings','refillMarket','startOnlineDraft','renderOnlineDraft','confirmOnlineDraftPick','autoCompleteOnlineDebugSetup','realOnlineRules','syncOnlineDebugRulesFromUI','makeRealDraftInitialState','maybeStartRealOnlineDraft','applyRealDraftPick','renderRealOnlineDraft','maybeStartRealOnlineResources','renderOnlineResourceSelection','renderRealOnlineResourceSelection','renderRealOnlineResources','applyRealResourceInit','applyRealOnlineRules','enterRealOnlineLobby','queueBotDraft','queueBotResources']);
 assert.deepEqual(current.filter(x=>x.name&&added.has(x.name)).map(x=>x.name),[...added]);
 assert.deepEqual(current.filter(x=>x.name&&!added.has(x.name)).map(x=>x.name),previous.filter(x=>x.name).map(x=>x.name));
 const old=new Map(previous.filter(x=>x.name).map(x=>[x.name,x]));
 for(const x of current)if(x.name&&!added.has(x.name)&&!changed.has(x.name))assert.equal(x.hash,old.get(x.name).hash,'Unexpected function/constant change: '+x.name);
 // The setup listeners move inside the private closure so their settings references are valid.
 const prefixes=["fillLegendSlotSelect('#settingLegendSlots'","q('#playerCount').addEventListener","q('#onlineCharNext').onclick","q('#settingMarketTypes')?.addEventListener","q('#onlineDebugRuleMarketTypes')?.addEventListener"];
 const protectedCounts=list=>{const counts={};for(const x of list)if(!x.name&&!prefixes.some(p=>x.start.startsWith(p)))counts[x.hash]=(counts[x.hash]||0)+1;return counts};
 assert.deepEqual(protectedCounts(current),protectedCounts(previous));
 assert.equal(fs.readFileSync(path.join(root,'js/app.js'),'utf8'),code);
 for(const [name,digest]of Object.entries(baseline.protectedFiles))assert.equal(sha(fs.readFileSync(path.join(root,name))),digest,name);
});
test('225 HTML: only version/default values change, with the same layout and runtime script order',()=>{
 let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const fields={WinVP:20,MarketTypes:8,InitialResources:4,HireLimit:3};
 for(const prefix of ['setting','realRule','onlineDebugRule'])for(const [field,value]of Object.entries(fields))html=html.replace(new RegExp('(id="'+prefix+field+'"[^>]*value=")[^"]+("[^>]*>)'),(_,a,b)=>a+value+b);
 html=html.replace('id="marketTarget">12','id="marketTarget">8');assert.equal(sha(normalize(html)),baseline.htmlShellSha256);
 assert.deepEqual([...html.matchAll(/<script src="([^"]+)"/g)].map(x=>x[1]),['https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2','packs/pack1.js','packs/pack2.js','packs/rules_pack1.js','js/app.js?v=0.3.225']);
});
