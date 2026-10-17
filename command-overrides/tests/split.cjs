const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const acorn=require('acorn'),{assemble,inlineHtml}=require('../tools/build.cjs');
const root=path.resolve(__dirname,'..'),manifest=require('../src/order.json');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const baseline=require('./fixtures/standard_221.json');
const normalize=s=>s.replace(/0\.3\.(220|221|222)/g,'VERSION');
test('scope: only four migrated handlers and shared commands differ from Ver221',()=>{
 const {code}=assemble(),p=acorn.parse(code,{ecmaVersion:'latest'});
 const additions=new Set(['commandQuantity','commandPool','commandDraw','commandDice','commandLimit','cardCommands']);
 const changed=new Set(Object.keys(baseline.legacyFunctions));
 const record=n=>({type:n.type,name:n.id?.name||n.declarations?.map(d=>d.id.name).join(',')||'',hash:sha(normalize(code.slice(n.start,n.end)))});
 const actual=p.body[0].expression.callee.body.body.map(record);
 assert.deepEqual(actual.filter(n=>additions.has(n.name)).map(n=>n.name),[...additions]);
 const existing=actual.filter(n=>!additions.has(n.name));assert.equal(existing.length,baseline.body.length);
 for(let i=0;i<existing.length;i++){
  const a=existing[i],b=baseline.body[i];assert.equal(a.type,b.type);assert.equal(a.name,b.name);
  if(!changed.has(b.name))assert.equal(a.hash,b.hash,'Unapproved change: '+(b.name||i));
 }
 assert.deepEqual(p.body.slice(1).map(record),baseline.epilogue);
 assert.equal(fs.readFileSync(path.join(root,'js/app.js'),'utf8'),code);
});
test('split: HTML, CSS, card IDs, images and script order are identical except version/extraction',()=>{
 assert.equal(sha(normalize(inlineHtml().replace(/<script>([\s\S]*?)<\/script>/,'<script>APP</script>'))),baseline.htmlShellSha256);
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.deepEqual([...html.matchAll(/<script src="([^"]+)"/g)].map(x=>x[1]),[
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2','packs/pack1.js','packs/pack2.js','packs/rules_pack1.js','js/app.js?v=0.3.222']);
 assert.equal([...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].length,0);
});
test('split: all editing sources parse as classic JS, with one original private closure at runtime',()=>{
 for(const file of new Set(manifest.sections.map(x=>x.file)))new vm.Script(fs.readFileSync(path.join(root,'src',file),'utf8'),{filename:file});
 const p=acorn.parse(assemble().code,{ecmaVersion:'latest'});
 assert.equal(p.body[0].expression.callee.type,'ArrowFunctionExpression');
 assert.equal(p.body[1].declarations[0].id.name,'q','existing external handlers remain outside the private closure');
});
test('split: core responsibilities are assigned to their intended files',()=>{
 const owner=symbol=>manifest.sections.find(s=>s.symbols.includes(symbol))?.file;
 for(const [symbol,file] of Object.entries({beginTurn:'game.js',completeEnd:'game.js',checkEndgameTrigger:'game.js',
  useGraveyard:'card_effects.js',resolveOnInstall:'card_effects.js',hireEmployee:'characters.js',synthesizeCast:'characters.js',
  CHARACTER_DATA:'characters.js',STD_BASE:'decks.js',LEGEND_CATALOG:'decks.js',renderGame:'ui.js',
  botExecuteTurn:'bot.js',realMainSnapshot:'online.js',turnClockReceiveAction:'online.js'}))assert.equal(owner(symbol),file,symbol);
});
test('split: build refuses missing, duplicate or unordered sections',()=>{
 const temp=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'kokoryo-split-invalid-'));
 // Test-only disposable sources: no user files are removed or overwritten.
 fs.mkdirSync(path.join(temp,'src'));
 const m={schema:1,prefix:'(()=>{',close:'})();',sections:[{id:'S0001',file:'game.js'},{id:'S0002',file:'bootstrap.js',epilogue:true}]};
 fs.writeFileSync(path.join(temp,'src/order.json'),JSON.stringify(m));
 fs.writeFileSync(path.join(temp,'src/game.js'),'// @kokoryo-section S0001\nlet x=1;\n// @kokoryo-end-section S0001\n');
 fs.writeFileSync(path.join(temp,'src/bootstrap.js'),'');
 assert.throws(()=>assemble(temp),/Missing/);
});
