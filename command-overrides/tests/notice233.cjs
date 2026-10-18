const {test}=require('node:test'),assert=require('node:assert/strict'),{fixture}=require('./clock.cjs');
for(const bot of [false,true])for(const score of [30,31])test('233 '+(bot?'Bot':'human')+' crosses 29 → '+score+', notice persists once through render and remaining turns',async t=>{
 const h=await fixture(t);h.run(`gameSettings.winVP=30;botMatchMode=${bot};onlineDebugMode=${bot};onlineDebugPlayers=['human','Bot 1','Bot 2','Bot 3'];turn=${bot?1:0};viewer=0;turnClockState.active=turn;installed[turn]=[{id:'vp',name:'VP test',type:'N',vp:29}];renderGame()`);
 assert.equal(h.run('endgameStarter'),null);h.run(`installed[turn][0].vp=${score};renderGame();renderGame();renderGame()`);
 const owner=bot?1:0,box=h.dom.window.document.querySelector('#gameover');assert.match(box.textContent,new RegExp('P'+(owner+1)+'が30VP到達'));assert.equal(box.classList.contains('hidden'),false);assert.equal(h.run('[...triggerNotices,...dialogLog.map(x=>x.text||x.message||x)].filter(x=>String(x).includes("VP以上になりました")).length'),1);assert.equal(h.run('endgameRemaining'),3);
 h.run('completeEnd()');assert.equal(h.run('endgameRemaining'),3);assert.equal(h.run('gameEnded'),false);
 for(let i=0;i<2;i++){h.run('completeEnd()');assert.equal(h.run('gameEnded'),false);assert.match(box.textContent,/30VP到達/)}
 h.run('completeEnd()');assert.equal(h.run('gameEnded'),true);assert.match(box.textContent,new RegExp('P'+(owner+1)+' の勝利'));assert.equal(h.run('turnClockState.active'),null);
});
test('233 configured VP threshold remains dynamic, no hardcoded 30 and no new event after reset',async t=>{
 const h=await fixture(t);h.run("gameSettings.winVP=20;installed[0]=[{name:'VP',type:'N',vp:21}];renderGame()");assert.match(h.dom.window.document.querySelector('#gameover').textContent,/20VP到達/);h.run('resetGameEndState();installed[0]=[];renderGame()');assert.equal(h.run('endgameStarter'),null);assert.equal(h.run("q('#gameover').classList.contains('hidden')"),true);
});
