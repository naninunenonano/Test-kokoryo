const {test}=require('node:test'),assert=require('node:assert/strict'),{fixture}=require('./clock.cjs');
test('232 clock accumulates exactly 60 seconds over multiple own turns without charging other players',async t=>{
 const h=await fixture(t);h.advance(100000);h.run('completeEnd()');assert.deepEqual(h.read('turnClockState.remaining'),[260000,300000,300000,300000]);
 for(let i=0;i<3;i++)h.run('completeEnd()');h.advance(90000);h.run('completeEnd()');assert.deepEqual(h.read('turnClockState.remaining'),[230000,300000,300000,300000]);
 assert.equal(h.dom.window.document.querySelector('[data-clock-player="0"]').dataset.seconds,'230');
});
test('232 clock stop/resume preserves remaining time and dynamic display explains 60/300',async t=>{
 const h=await fixture(t);h.advance(45000);h.run('turnClockStop()');h.advance(120000);assert.equal(h.run('turnClockState.remaining[0]'),255000);h.run('turnClockBeginTurn()');h.advance(15000);assert.equal(h.run('turnClockState.remaining[0]'),240000);assert.match(h.dom.window.document.querySelector('#turnClockPanel').textContent,/終了時＋60秒（上限300秒）/);
});
test('232 start panel at 320 CSS-pixel fixture retains every face and actionable buttons, with wrapping containment rules',async t=>{
 const h=await fixture(t);Object.defineProperty(h.dom.window,'innerWidth',{value:320});h.run("powers[0]={y:1000,p:2000,r:3000};pendingLordResource=2;dice=[1,2,3,4,5,6,'any'].map((value,i)=>({id:i+1,value,used:false}));breadHands[0]=[1,2,3,4,5,6].map(value=>({value}));renderTurnStart()");
 assert.equal(h.dom.window.document.querySelectorAll('.turnstart-inventory [data-inventory-kind="dice"] span').length,7);assert.equal(h.dom.window.document.querySelectorAll('.turnstart-inventory [data-inventory-kind="orders"] span').length,6);
 const style=h.dom.window.document.querySelector('#turn-start-inventory-232').textContent;assert.match(style,/box-sizing:border-box;max-width:calc\(100vw - 24px\)/);assert.match(style,/repeat\(auto-fit,minmax\(60px,1fr\)\)/);assert.match(style,/overflow-wrap:anywhere/);
 const button=h.dom.window.document.querySelector('#turnstarteffects .turnstart-buttons button');assert.equal(button.disabled,false);button.click();assert.equal(h.run('powers[0].y'),1001);
});
