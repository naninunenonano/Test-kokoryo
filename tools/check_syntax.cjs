const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=process.argv[2]||'_site';
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
let scripts=0;
for(const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)){if(match[1].trim()){new vm.Script(match[1]);scripts++}}
for(const name of ['pack1.js','pack2.js','rules_pack1.js']){new vm.Script(fs.readFileSync(path.join(root,'packs',name),'utf8'));scripts++}
console.log(`${scripts} scripts parsed successfully`);
