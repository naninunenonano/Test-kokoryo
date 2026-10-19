const base=require('./scope238.json');
exports.restore=code=>{code=require('./characters239.cjs').restore(code);for(const [now,old] of [...base.inverse].reverse()){const i=code.indexOf(now);if(i<0||code.indexOf(now,i+1)>=0)throw Error('238 inverse region missing or ambiguous');code=code.slice(0,i)+old+code.slice(i+now.length)}return code};
