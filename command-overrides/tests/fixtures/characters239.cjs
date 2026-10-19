const base=require('./scope239.json');
exports.restore=code=>{code=require('./selection240.cjs').restore(code);if(!code.includes('// TEST239:'))return code;for(const [now,old] of [...base.inverse].reverse()){const i=code.indexOf(now);if(i<0||code.indexOf(now,i+1)>=0)throw Error('239 inverse region missing or ambiguous');code=code.slice(0,i)+old+code.slice(i+now.length)}return code};
exports.restoreHtml=html=>{html=require('./selection240.cjs').restoreHtml(html);for(const [now,old] of base.htmlInverse)html=html.replace(now,old);return html.replaceAll('0.3.239','0.3.238')};
