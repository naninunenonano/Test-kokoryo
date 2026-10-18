const acorn=require('acorn'),base=require('./selection235.json');
exports.restore=code=>{const p=acorn.parse(code,{ecmaVersion:'latest'}),nodes=[...p.body[0].expression.callee.body.body,...p.body.slice(1)];for(const n of nodes.filter(n=>base.functions[n.id?.name]).sort((a,b)=>b.start-a.start))code=code.slice(0,n.start)+base.functions[n.id.name]+code.slice(n.end);return code};
