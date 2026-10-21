const base=require('./scope241.json');
const apply=(s,patches)=>{for(const [now,old] of [...patches].reverse()){const i=s.indexOf(now);if(i<0||s.indexOf(now,i+1)>=0)throw Error('241 inverse region missing or ambiguous');s=s.slice(0,i)+old+s.slice(i+now.length)}return s};
exports.restore=code=>(code=require('./selection242.cjs').restore(code),code.includes('// TEST241:')?apply(code,base.inverse):code);
exports.restoreHtml=html=>(html=require('./selection242.cjs').restoreHtml(html),html.includes('id="card-layout-241"')?apply(html,base.htmlInverse):html);
exports.restoreSource=(name,s)=>(s=require('./selection242.cjs').restoreSource(name,s),base.sourceInverse[name]&&s!==base.sourceInverse[name].map(x=>x[1]).join('')?apply(s,base.sourceInverse[name]):s);
