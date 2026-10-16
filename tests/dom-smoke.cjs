// DOM execution smoke test, not a substitute for Safari/device testing.
// npm ci --ignore-scripts
const {JSDOM,requestInterceptor,VirtualConsole}=require('jsdom');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../_site');
const origin='https://naninunenonano.github.io/Test-kokoryo/';
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function waitUntil(predicate){
 const deadline=Date.now()+10000;
 while(!predicate()){
  assert.ok(Date.now()<deadline,'screen transition timed out');
  await pause(25);
 }
}
async function open(){
 const errors=[],requests=[];
 const assets=requestInterceptor(request=>{
   const url=request.url;
   requests.push(url);
   assert.ok(url.startsWith(origin),'external asset requested: '+url);
   return new Response(fs.readFileSync(path.join(root,url.slice(origin.length))),{headers:{'Content-Type':'application/javascript'}});
 });
 const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 // Expose the connection guards only inside this test DOM, never in the deployed file.
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(
  '\n})();\nconst q=s=>document.querySelector(s);',
  '\nwindow.__connectionGuards={ensureSupabaseClient,enterRealOnlineLobby,loadRealOnlineResume};\n})();\nconst q=s=>document.querySelector(s);');
 const dom=new JSDOM(html,{
  url:origin,runScripts:'dangerously',resources:{interceptors:[assets]},virtualConsole:vc,
  beforeParse(w){
   w.alert=m=>errors.push('alert: '+m);w.confirm=()=>true;w.prompt=()=>null;
   w.structuredClone=structuredClone;
   w.fetch=()=>{errors.push('unexpected fetch');throw Error('network disabled');};
   w.WebSocket=class{constructor(){errors.push('unexpected WebSocket');throw Error('network disabled');}};
   w.supabase={createClient(){errors.push('unexpected Supabase client');throw Error('network disabled');}};
   w.localStorage.setItem('kokoryo_custom_decks_v1','production sentinel');
   w.localStorage.setItem('kokoryo_online_resume_v36','production sentinel');
  }
 });
 await new Promise((resolve,reject)=>{
  if(dom.window.document.readyState==='complete')return resolve();
  dom.window.addEventListener('load',resolve,{once:true});
  setTimeout(()=>reject(Error('DOM load timeout')),5000).unref();
 });
 const q=s=>dom.window.document.querySelector(s);
 assert.throws(()=>dom.window.__connectionGuards.ensureSupabaseClient(),/オフライン/);
 assert.equal(await dom.window.__connectionGuards.enterRealOnlineLobby('test','test'),false);
 assert.equal(dom.window.__connectionGuards.loadRealOnlineResume(),null);
 const click=s=>{const el=q(s);assert.ok(el,s);assert.ok(!el.disabled,s+' disabled');el.click();};
 const visible=s=>assert.ok(!q(s).classList.contains('hidden'),s+' hidden');
 const finish=()=>{
  assert.equal(dom.window.localStorage.getItem('kokoryo_custom_decks_v1'),'production sentinel');
  assert.equal(dom.window.localStorage.getItem('kokoryo_online_resume_v36'),'production sentinel');
  assert.deepEqual(errors,[]);assert.equal(requests.length,3);
  dom.window.close();
 };
 return {dom,q,click,visible,finish,errors};
}
(async()=>{
 const local=await open();
 local.click('#testOfflineStart');local.visible('#setup');
 local.click('#start');local.visible('#draft');
 for(let i=0;i<12;i++)local.click('#cards .card');
 local.visible('#initialPowerSetup');
 for(let p=0;p<4;p++){
  for(let i=0;i<4;i++)local.click('#initialPowerSetup .turnstart-buttons button');
  local.click('#initialPowerSetup .row button.primary');
 }
 local.visible('#game');
 local.finish();console.log('PASS: offline setup → 12 draft picks → resource selection → game; production storage untouched, no connections');
 const bot=await open();
 bot.click('#testBotStart');bot.visible('#onlineDebugLobby');
 assert.ok(bot.q('#addDummyPlayer').disabled);
 bot.click('#onlineLobbyCharacterSelect');bot.visible('#onlineCharacterScreen');
 bot.click('#onlineCharGrid .online-char-card');
 bot.click('#onlineCharOptions .online-version-choice');
 bot.click('#onlineCharOptions .online-gender-choice button');
 assert.equal(bot.dom.window.document.querySelectorAll('#onlineCharPlayers .done').length,4);
 bot.click('#onlineCharNext');bot.visible('#onlineDraftScreen');
 for(let i=0;i<3;i++){
  bot.click('#onlineDraftCards .online-draft-card');bot.click('#onlineDraftConfirm');
  await waitUntil(()=>i<2
   ? Number(bot.q('#onlineDraftRound').textContent)===i+2
   : !bot.q('#onlineResourceScreen').classList.contains('hidden'));
 }
 bot.visible('#onlineResourceScreen');
 for(let i=0;i<4;i++)bot.click('#onlineResourceChoices .turnstart-buttons button');
 bot.click('#onlineResourceConfirm');
 await waitUntil(()=>!bot.q('#game').classList.contains('hidden'));
 bot.visible('#game');
 bot.finish();console.log('PASS: Bot lobby → human/Bot character selection → 3-round draft → resource selection → game; no connections');
})().catch(e=>{console.error(e);process.exit(1)});
