const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const acorn=require('acorn'),{assemble,inlineHtml}=require('../tools/build.cjs');
const root=path.resolve(__dirname,'..'),manifest=require('../src/order.json');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const baseline=require('./fixtures/scope_223.json'),shellBaseline=require('./fixtures/standard_221.json');
const normalize=s=>s.replace(/0\.3\.(220|221|222|223|224)/g,'VERSION');
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
