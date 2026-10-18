// TEST-owned deterministic assembler. Never accesses another repository.
const fs=require('node:fs'),path=require('node:path');
function assemble(root=path.resolve(__dirname,'..')){
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'src/order.json'),'utf8')),sections=new Map();
 for(const file of new Set(manifest.sections.map(x=>x.file))){
  const text=fs.readFileSync(path.join(root,'src',file),'utf8');
  const pattern=/^\/\/ @kokoryo-section (S\d+)\n([\s\S]*?)\n\/\/ @kokoryo-end-section \1(?:\n|$)/gm;
  for(const m of text.matchAll(pattern)){if(sections.has(m[1]))throw Error('Duplicate section '+m[1]);sections.set(m[1],{file,code:m[2]});}
 }
 let code=manifest.prefix,closed=false;const used=new Set();
 for(const s of manifest.sections){const found=sections.get(s.id);if(!found||found.file!==s.file||used.has(s.id))throw Error('Missing, duplicate or moved section '+s.id);if(s.epilogue){if(closed)throw Error('Duplicate epilogue');code+=manifest.close;closed=true;}code+=found.code;used.add(s.id);}
 if(!closed||used.size!==sections.size)throw Error('Missing or unordered sections');return {code,manifest};
}
function inlineHtml(root=path.resolve(__dirname,'..')){return fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/<script src="js\/app\.js(?:\?v=[0-9.]+)?"><\/script>/,'<script>'+assemble(root).code+'</script>');}
if(require.main===module){const root=path.resolve(__dirname,'..'),code=assemble(root).code,out=path.join(root,'js/app.js');if(process.argv.includes('--check')){if(!fs.existsSync(out)||fs.readFileSync(out,'utf8')!==code)throw Error('Stale bundle');}else{fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,code);}}
module.exports={assemble,inlineHtml};
