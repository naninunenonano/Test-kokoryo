const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {JSDOM,requestInterceptor,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..'),origin='https://example.invalid/project-prefix/';
const bridge='\nwindow.__splitTest={run:code=>eval(code)};';
async function open(t){
 const errors=[],requests=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8'),{
  url:origin,runScripts:'dangerously',virtualConsole:vc,
  resources:{interceptors:[requestInterceptor(req=>{
   requests.push(req.url);const u=new URL(req.url);
   if(u.hostname==='cdn.jsdelivr.net')return new Response('',{headers:{'Content-Type':'application/javascript'}});
   assert.ok(req.url.startsWith(origin));const file=u.pathname.replace('/project-prefix/','');
   let content=fs.readFileSync(path.join(root,file),'utf8');
   if(file==='js/app.js')content=content.replace('\n})();\nconst q=s=>document.querySelector(s);',bridge+'\n})();\nconst q=s=>document.querySelector(s);');
   return new Response(content,{headers:{'Content-Type':'application/javascript'}});
  })]},
  beforeParse(w){w.alert=m=>errors.push('alert: '+m);w.confirm=()=>false;w.prompt=()=>null;w.structuredClone=structuredClone;
   w.fetch=()=>{throw Error('unexpected production fetch')};w.WebSocket=class{constructor(){throw Error('unexpected production WebSocket')}};
  }
 });
 await new Promise(resolve=>dom.window.addEventListener('load',resolve,{once:true}));
 assert.ok(dom.window.__splitTest,'app executes from external js/app.js');
 const run=code=>dom.window.__splitTest.run(code),read=code=>JSON.parse(run('JSON.stringify('+code+')'));
 t.after(()=>{dom.window.close();assert.deepEqual(errors,[])});
 return {dom,run,read,click:s=>{const e=dom.window.document.querySelector(s);assert.ok(e,s);assert.equal(e.disabled,false,s);e.click()},requests};
}
if(require.main===module){
test('startup: Pages-style subdirectory loads packs before the external app, no new globals',async t=>{
 const h=await open(t);
 assert.deepEqual(h.requests.map(x=>new URL(x).pathname.split('/').at(-1)),[
  'supabase-js@2','pack1.js','pack2.js','rules_pack1.js','app.js']);
 for(const key of ['beginTurn','turn','hands','powers','realMainSnapshot'])assert.equal(h.dom.window[key],undefined,key);
 assert.deepEqual(h.read('Object.keys(window.KOKORYO_PACKS)'),['pack1','pack2']);
 assert.ok(h.read('Object.keys(window.KOKORYO_RULE_PACKS).length')>0);
});
for(const packs of [[],['pack1'],['pack2'],['pack1','pack2']])test('startup: offline draft and initial resources reach game with '+(packs.join('+')||'base'),async t=>{
 const h=await open(t);
 h.run(`enterLocalDebugMode();gameSettings.enabledPacks=${JSON.stringify(packs)};renderCharacterSelects();q('#setup').classList.remove('hidden')`);
 h.click('#start');for(let i=0;i<20;i++)h.click('#cards .card');
 for(let p=0;p<4;p++){for(let i=0;i<10;i++)h.click('#initialPowerSetup .turnstart-buttons button');h.click('#initialPowerSetup .row button.primary')}
 assert.equal(h.read("q('#game').classList.contains('hidden')"),false);
 assert.equal(h.read('playerCount'),4);assert.equal(h.read('dice.length')>=3,true);
 assert.deepEqual(h.read('gameSettings.enabledPacks'),packs);
});

}
module.exports={open};
