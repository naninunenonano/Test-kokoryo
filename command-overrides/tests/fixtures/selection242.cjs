const base=require('./scope242.json');
const apply=(s,patches)=>{for(const [now,old] of [...patches].reverse()){const i=s.indexOf(now);if(i<0||s.indexOf(now,i+1)>=0)throw Error('242 inverse region missing or ambiguous');s=s.slice(0,i)+old+s.slice(i+now.length)}return s};
exports.restore=code=>code.includes('// TEST242:')?apply(code,base.inverse):code;
exports.restoreHtml=html=>html.includes('id="selection-layout-242"')?apply(html,base.htmlInverse):html;
exports.restoreSource=(name,s)=>base.sourceInverse[name]&&base.sourceInverse[name].some(([now])=>s.includes(now))?apply(s,base.sourceInverse[name]):s;
