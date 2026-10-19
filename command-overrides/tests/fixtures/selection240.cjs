const base=require('./scope240.json');
const apply=(s,patches)=>{for(const [now,old] of [...patches].reverse()){const i=s.indexOf(now);if(i<0||s.indexOf(now,i+1)>=0)throw Error('240 inverse region missing or ambiguous');s=s.slice(0,i)+old+s.slice(i+now.length)}return s};
exports.restore=code=>code.includes('// TEST240:')?apply(code,base.inverse):code;
exports.restoreHtml=html=>html.includes('/* TEST240:')?apply(html,base.htmlInverse):html;
exports.restoreSource=(name,s)=>base.sourceInverse[name]&&s.includes('// TEST240:')?apply(s,base.sourceInverse[name]):s;
