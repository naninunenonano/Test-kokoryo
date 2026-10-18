(()=>{
window.KOKORYO_RULE_PACKS=window.KOKORYO_RULE_PACKS||{};
window.KOKORYO_RULE_PACKS.rules_pack1={
 id:'rules_pack1', name:'追加ルールパック1',
 ruleCards:[{
  id:'RC1',name:'市場流動化',effectText:'各プレイヤーのターン終了時、現在の市場カードをすべて捨て札にし、市場を規定数まで新しく公開する。',
  hooks:{turnEnd(ctx){ctx.api.discardMarketAndRefill();ctx.api.notice('RC1《市場流動化》：ターン終了時に市場をすべて入れ替えました。');}}
 },{
  id:'RC2',name:'暗黒時代',effectText:'各プレイヤーは、自分のターン開始時に負債を1枚獲得する。',
  hooks:{turnStart(ctx){const gained=ctx.api.addDebt(ctx.player,1);if(gained>0)ctx.api.notice('RC2《暗黒時代》：ターン開始時に負債を1枚獲得しました。');}}
 },{
  id:'RC3',name:'買い手市場',effectText:'雇用コストが無料になる。雇用可能数+1。通常の1ターン1回の雇用制限はそのまま。',hooks:{}
 },{
  id:'RC4',name:'超好景気',effectText:'各プレイヤーは、自分のターン開始時に好きな資源を合計2個獲得する。',hooks:{}
 },{
  id:'RC5',name:'成長促進',effectText:'URまでの通常雇用融合に必要な雇用キャラクターが2人から1人になる。LR融合には適用されない。雇用融合は1ターンに1回まで。',hooks:{}
 }]
};
})();
