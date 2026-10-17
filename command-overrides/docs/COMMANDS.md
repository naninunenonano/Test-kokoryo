# 汎用カードコマンド 第1段階 — TEST Ver.0.3.222

基準: Ver.0.3.221 / `1ca6ccfcf7c5f9cddea8c508f472b0af04a9167a`。
実装は `src/game.js` の既存 S0026 内。`src/order.json` の順序は変更しない。
`cardCommands` は従来のゲームのクロージャ内に置き、windowには公開しない。
他カードの処理から同じAPIを呼べる。追加パックAPIや既存の基礎関数の置換はしない。

| コマンド・引数 | 用途・戻り値 | 今回の使用カード |
| --- | --- | --- |
| `pool(resource, quantity, options?)` | `y`資金 / `p`食料 / `r`兵力。実際に獲得した数量を返す | S5 鉱山、S6 農場、S7 兵舎 |
| `draw(target, quantity, options?)` | `deck`山札から手札 / `debt`負債 / `command`命令書。`{count,cards}`を返す。負債のcardsは空配列 | S8 司令室、S10 教会。負債は直接テストのみ |
| `dice('roll', {count?,source?})` | 新しいランダムな実サイコロをcount個獲得 | 直接テストのみ |
| `dice('gain', {value,count?,source?})` | 指定出目の新しい実サイコロを獲得 | 直接テストのみ |
| `dice('reroll', {dieId})` | 指定した未使用の実サイコロを振り直す | S1 作戦計画書 |
| `dice('adjust', {dieId,delta})` | 選択サイコロを整数delta分変更、1〜6に丸める | S2 人員調整書（±1） |
| `dice('set', {dieId,value})` | 選択サイコロを指定出目に変更 | S3 制限令（1）、S4 特別許可書（6） |
| `dice('choose', {dieId,value})` | 呼び出し元で選んだ好きな出目に変更。setと同じ変更処理 | 直接テストのみ |
| `limit('hand', delta, {base?,count?}?)` | 手札上限を `base + delta × count` で計算して返す | S9 倉庫（+2×現在の枚数） |

数量は非負の安全な整数。出目valueは1〜6の整数。deltaは符号付き整数。
不明な対象・操作、不正数量・出目は変更前に例外となる。diceは変更/獲得した実サイコロの配列を返し、選択したサイコロが使用済み・存在しない場合は空配列を返す。
diceのcountは新規獲得時のみ使用し、省略時1。既存サイコロの操作はdieIdで1個を指定する。
新規サイコロのIDは現在の最大ID+1から連番、usedはfalse、sourceは既定でeffect。
既存サイコロのID・source・usedとオブジェクト参照を維持し、命令書は操作しない。

## 呼び出し元が管理すること

- ターン開始/任意使用などの発動タイミング。
- どのカードが何回使ったか、費用の支払い、UIでの選択。
- 描画、通信、通知文、反応効果の発火。

コマンド自体にこれらを追加しない。S1〜S4は従来どおり `stdAbilityUsed[cardId]` でカード個体ごとに管理する。
有効なサイコロに使用した際は、±1が端で丸められて同じ出目になっても使用済みとなる。
ターン開始時のリセットと同期データ形式は変更しない。

## 資源獲得の互換性

poolのoptionsは `{owner=turn, source='effect', respectRestrictions=true}`。
既定では既存 `gainResource` を呼び、資源獲得禁止・世界恐慌の開始時抑止を維持する。
従来のS5〜S7の通常ターン開始処理は直接加算だったため、その呼び出しだけ明示的に
`respectRestrictions:false` とする。再発動処理では既定の制限判定を維持する。
この既存の経路差は今回の仕様変更対象ではない。世界恐慌獲得直後の最終的な資源復元も既存の開始処理が行う。
鉱山・農場・兵舎の既存レジェンド補正は呼び出し元で従来どおり計算し、同名カード枚数分適用する。

drawのoptionsは `{owner=turn}`。drawOne / drawBread / acquireDebt を再利用する。
山札の循環・命令書の供給不足・負債禁止と在庫を維持する。山札ドローは手札に入り、直接設置しない。

limitは保存状態を追加せず純粋に計算する。baseの既定値はgameSettings.handLimit、countは1。
handLimitは設置・仮設置中の倉庫枚数を毎回数えるため、重複・撤去・仮設置確定・同期後も上限が再計算される。
負債を手札枚数に含める既存処理や、負債保護の処理は変更しない。

## 検査方法と対象外

`npm run build && npm run analyze && npm test`。
tests/fixtures/standard_221.jsonに変更前の4関数と全既存トップレベル文の照合値を保存。
新旧処理を同じ乱数・状態で実行し、結果・供給・通知・使用状態を比較する。
許可した4関数と共通コマンド以外は、バージョン文字列以外のコード変更を検査で拒否する。

N・レジェンド・領主・雇用・パックの効果定義、Bot判断、オンライン処理、カードデータは今回変更しない。
共通雇用・toba・汎用コマンドへの他カード移行は対象外。
TESTはオフライン/Bot専用。オンラインは通信を模した4クライアント検査で、実サーバーは操作しない。

# 第2段階 — TEST Ver.0.3.223

基準はTEST Ver.0.3.222 / `d8ea65d327d11692f82b0de11efd7a649df6663c`。
新しい11コマンドとゾーン解決補助は `src/game.js` の既存S0026に実装。第1段階の4コマンドも引き続き使用する。order.jsonは変更なし。

| コマンド・内部引数 | 用途・戻り値 | 使用カード |
| --- | --- | --- |
| `choice(zone, n, {owner,where,select})` | 明示ゾーンか配列から選択したカードの配列。nは整数/all。selectは候補の添字かカード参照。選択のみ、移動/発火しない | N1/N11/N14 |
| `move(cards, from, to, {replaceSource})` | 指定元から指定先へ移動しカード配列を返す。双方を明示、全対象を事前検証。設置状態の自動探索や効果発火はしない | N1/N4–N7/N11/N14/N15 |
| `start(owner, n, {queue,step})` | ownerから手番順に人数n(all可)の配列。queue付きでは先頭プレイヤーだけ処理し、step成功後に1人進める。falseなら待機を維持 | N1 |
| `change('market', n)` | 指定枚数/allを捨て札に移し、現行上限まで補充 | N1 |
| `can(card, condition, {owner,value})` | 設置済み/仮設置/特殊種別/現在手番の雇用空き、または呼出側の判定関数を評価。状態変更なし | N4–N7/N15 |
| `count(zoneOrPlayersOrResources, predicate, {owner})` | 条件に合う枚数/人数/資源合計を返す。返した数値は移動後も不変 | N8–N10/N12/N13 |
| `plus('market', target='max')` | maxは既存refillMarketを使用。数値ならその種類数まで補充。上限変更ではない | N14（N1のchangeからも使用） |
| `trigger(event, context, rule)` | 同名イベント、対象、条件、各項目、効果個体数を照合し効果を実行。結果配列を返す | N8–N10/N12 |
| `hire('gacha', n, {accept,canHire})` （雇用） | 既存gachaCastで抽選しacceptで確定。既定acceptは既存finalizeHire。雇用条件はcanHireと呼出元で維持 | N15 |
| `toba({owner})` | 山札先頭を既存drawOneで取得しregisterInstallationで仮設置。設置反応と連鎖も従来通り。取得カード/nullを返す | N3 |
| `once(n, 'turn'/'game', {cardId,usage,owner,consume})` | 明示した既存台帳で個体別判定。consume時だけ記録。boolを返す | S1–S4/N11/N14 |

zoneはhand/installed/temporary/market/discard/deck。プレイヤー別ゾーンは `{zone:'hand',owner:2}` のように指定できる。choiceには合成候補配列も渡せる。UIは従来の選択画面・入力を使い、choiceが勝手にユーザーの選択を決めることはない。候補一覧にはn=all、確定には明示selectを使用する。

startのqueueは呼出側の直列化可能な配列。非同期のUI待機中はstepを呼ばず、選択コミット時に呼ぶ。Promiseやコールバックを同期状態へ保存しない。N1は従来のpendingParkPlayers/pendingParkTakenを使い、選択のたびに既存オンライン経路で状態を共有。途中補充はしない。

triggerのruleは `{event,targets,when,instances,match,effect,aggregate}`。contextは `{actor,items}`。itemsの一致1件×個体1つにつきeffectを1回呼ぶ。aggregate=trueならhits/count/occurrencesを渡して従来と同じ合算処理を1回呼ぶ。N8–N10とN12は従来の負債在庫消費順・資源制限判定・通知文を保つため、この等価な合算経路を使う。毎回、現在の設置カードから対象を求める。永続リスナーや登録状態を追加せず、二重発動を避ける。

onceはstdAbilityUsed、graveyardUsed、publicMarketUsedをそのまま使う。Sはowner省略、Nはowner指定。使用済みtrue/未使用falseの旧データにも対応し、n=1では従来と同じtrueを記録する。n=2なら数値で個体別に回数を記録できる。判定と消費を分け、キャンセル/不足/無効な対象で消費しない。期間に対応した台帳の寿命とリセットは呼出側が管理する。turnは従来のbeginTurnでリセットし、gameにはそれとは別のゲーム全体で保持する台帳を渡せる設計。今回gameや2回の制限を既存カードへ追加しない。

N15は既存のScoutと通常finalizeHireに相違（再抽選条件、コピー/派遣会社の扱い、通常雇用使用済み）があるため、Scoutの確定処理をacceptへそのまま渡す。既存仕様を保ち、通常雇用や追加パックの雇用確定処理は変更しない。

## N1〜N15の移行結果

- N1: change→既存選択キューをstartで構築→choice/move→startで次の選択者へ。空場の終了処理も維持。
- N2: 既存の指定順/在庫不足停止を保ち、各人の獲得をdrawへ移行。
- N3: tobaへ移行。ドロー先は手札ではなく従来の仮設置。
- N4–N7: 置き換え元をcanで判定しmove。開始時はpool/draw。通常設置の費用/サイコロは従来通り。
- N8–N10: trigger/count。既存負債獲得/資源獲得経路・人数補正・各個体×各該当ダイスの効果量を維持。
- N11: choice/move/once。資源選択後に回収と消費を確定。
- N12: trigger/pool。仮設置の瞬間に既存registerInstallationから1回反応。
- N13: count/pool。資源合計5以上の他プレイヤー数、人数補正、同名枚数を維持。
- N14: choice/move/plus/once。獲得カードも破棄候補に含め、キャンセルは原子的。公開場は最後にだけ補充。
- N15: can/move/hire。仮設置中は使用不可、設置済みを捨てて既存抽選/確定処理。

## 明示確認した変更と検証の限界

調査でVer.0.3.222のS1振り直しにN8–N10の反応がなかったため確認し、ユーザーが「指定どおり発動させる」を選択した。この1点を修正する。S1で振り直した未使用ダイス1個だけを再判定し、既存通知は消さない。出目固定/±1/消費では発火しない。ターン開始時は従来のresolveReactiveRollsから全ダイスを1回処理する。

その他の新旧比較はtests/fixtures/normal_222.jsonの固定した実関数を同じ状態・乱数で実行する。対象外の処理変更はscope検査で拒否。レジェンド/追加パック/変動VP/function/boost/ban/remove/resetの導入は対象外。

実Supabase複数端末、iPhone Safari実機、全カードの全組合せは未検証。TESTのオンライン禁止・保存先分離は維持し、同期は模擬4クライアントで検証する。

# TEST Ver.0.3.224 — レジェンド・雇用・領主・UI

この節を現行仕様とする。上のVer.0.3.222/223の節は当時の記録であり、今回追加した機能の対象外という意味ではない。

## 登録と呼び出し

正式コマンドは24種。すべて `src/game.js` の `cardCommands` に登録する。
`pool, draw, dice, limit, choice, move, start, change, can, count, plus, trigger, koyou, toba, once, repeat, boost, function, cast, copy, remove, discount, end, "the end"`。
`hire` はVer.0.3.223との一時互換エイリアス。新しい呼び出しは `koyou` を使う。日本語のコマンド識別子は登録しない。日本語のUI・カード名・引数は維持する。

これは文字列DSLではなくJS APIである。`cardCommands.run('the end')` は空白を正規化して単一コマンドとして認識する。`run('end')` は通常のターン終了だけを行う。繰り返しブロックの継続は `next()`、終了は `done()` であり、`end` をブロック終端として解釈しない。
追加パックは `packRuntimeApi(owner).commands` から同じ処理を利用できる。ownerを伴う資源・ドロー・選択等は指定所有者へ作用し、共有ダイスや雇用・終了は手番所有者に限る。

| コマンド | 引数・戻り値と独立した役割 |
|---|---|
| pool / draw / dice | 既存の在庫・制限・出目と共通獲得経路を維持。選択ダイスはgain、出目変更はset/adjust/choose、振り直しはreroll |
| limit | hand/hireの基準値＋補正。保存値を二重加算しない |
| choice | 明示ゾーンまたは候補配列と `select`。カード以外の文字列候補（能力・資源等）にも利用できる。状態変更なし |
| move | 明示したfrom/toから移動。employees、bread、breadDiscardにも対応。`index`で移動先の位置を指定可能。設置効果を発動しない |
| start | 開始プレイヤー・人数・step。選択待ちは既存の直列化可能なqueueを利用 |
| change | convert / exchange / market。日本語引数「資源変換」「資源交換」「公開場」も同じ処理へ正規化 |
| can / count | 関数条件による判定・固定数値取得。カード移動後も既得の数値は変化しない |
| plus | 現在の市場上限まで補充。上限自体を変えない |
| trigger | イベント・actor・items・対象個体を明示。新規獲得と出目変更を混同しない |
| koyou | `('gacha', n, {accept,canHire})` または `('select',n,{pool,selected,accept})`。抽選・候補検証・個体複製を共通化し、各呼出元の既存雇用確定条件を維持 |
| toba | `({owner,card,from})`。任意の明示ゾーンから無料設置。card省略時は山札先頭、生成カードはcreated:true。registerInstallationで設置時効果を通常解決 |
| once | 既存の個体台帳を使う。turn/game、任意の上限、判定と消費を分離。台帳のリセットは既存タイミングに従う |
| repeat | `(n,{index,step:(i,next)=>...,done})`。nextされるまで次へ進まない。同じnextは1回のみ有効 |
| boost | `(base,amount,{count,stack:'add'/'max'})`。再利用可能な効果量計算 |
| function | `({target,owner,where,value,multiplier,flat,divisor,round})` または式関数で現在状態を動的計算 |
| cast | コマンド配列、または通常開始時効果のプログラムを即時実行。追加パック側は配列を直接渡せる |
| copy | 能力定義から一時プロフィールを取得。初回命令書追加・初回資源は含めない。初回限定・コピー禁止能力は除外 |
| remove | 資源キー／キー配列／allとquantity。除去数を返す |
| discount | `('install','dice',n,{sources,remaining})`。軽減数と必要残数の計算。既存の仮設置の費用選択・消費処理に接続 |
| end / the end | 既存の共通ターン終了／ゲーム終了エンジンへ接続。カード固有ハンドラーを呼び分けない |

## 共通の基本ルール

```js
cardCommands.change('convert',3,{kind:'die',dieId:1});
cardCommands.change('convert',3,{kind:'command',index:0}); // 命令書は固定2、ダイス補正なし
cardCommands.change('exchange',{from:'y',to:'p'}); // 通常3:1、有効な等価交換があれば1:1
cardCommands.change('market','all',{cost:{y:1,p:1,r:1}}); // UIの既存費用
cardCommands.change('market',2); // 指定枚数の交換も可能
```

サイコロの1/2=資金、3/4=食料、5/6=兵力は不変。神の恩恵はダイスの基本3に+2で合計5、複数ソースの重複は既存どおり。UI・Bot・時間切れは同じchangeを使う。獲得禁止と実際の取得数を尊重し、Undoは実取得数を戻す。
通常交換3:1・等価交換1:1は同じ関数の比率差だけで扱う。公開場の入れ替えはmove→plus。通常の補充上限・山札不足時の再利用は既存のまま。

確認済みの別の変更漏れとして、雇用ガチャ率をN60/R20/SR11/SSR6/UR3へ更新。スタンダードでもCURを候補に含める既存実装は維持。ユニーク除外後に候補のないレアリティだけ従来どおり再抽選する。勝利20VP・初期資源4・領主共通資源1・その他の未確定な本体再編は変更しない。

## 対象の接続先

- LL1〜LL3：boostで開始時獲得補正、functionで現在の施設VP。施設の出入りで即再計算し、固定加算しない。
- LL4：choice/koyou select。CLRを含めない通常雇用候補から選択。従来のLL4固有の雇用確定条件を維持。
- LL5：choice/move/start。自己の先行破棄、その後の全員の既存順を維持。移動による再設置効果なし。
- LL6：start/count/move/draw/pool。各人の通常手札＋命令書だけを破棄・計数。負債は維持。
- LU1：the end。
- LU2：once/choice/cast。2回をそれぞれ選択。複数の設置個体を独立管理。
- LU3：repeat/choice/toba。設置時効果でN1の選択待ちが生じたら、全員の選択完了後に次の設置へ。継続番号だけを既存turnClockChoiceへ保存し、関数は同期状態へ保存しない。
- LU4：choice/move/limit。雇用個体の初回・使用履歴を保持して所有者変更。仮設置時からの既存上限計算を維持。
- LU5：can/toba/remove/end。開始時専用条件を維持。
- LU6：once/choice/copy。設置個体にIDがないデータは共通のcommandInstanceIdで同期可能な個体識別子を付与。
- CN〜CSSR：同一のstaff走査とpool/diceで処理。CUR共通の出目選択ダイスは固有能力とは別に処理。
- CUR1〜CUR6とP1〜P12：同じUNIQUE_ABILITY_DEFS。神の贈り物+2/+3、神算鬼謀2+初回4、オーバークロック初回20、神の見えざる手2枚/破棄1枚で2資源を反映。
- P13〜P24の既存能力：リクリエイション±2、無限の黄金VP10（能力無効化なし）、神の恩恵+2/変換5、神託各個体2回、貢ぎ物の既存1回、デッドマンズトリガー開始時通常2+命令書2。神の見えざる手・デッドマンズのターン中操作は従来の重複可否を維持。

既存S1〜S10・N1〜N15のコスト・VP・タイミング・既存回数管理は変更しない。使用履歴は同じ台帳でonceへ接続し、二重管理しない。追加パックJSは変更せず、共有定義とPack APIだけ拡張する。

## 検証と制限

154件のNode自動テスト（既存回帰・新旧比較・DOM操作・4クライアント模擬同期）が合格。具体的な項目と未確認事項はVER224_REPORT.mdを参照。
実Supabase接続・iPhone Safari実機・人間による初期設定から終局までの通し対戦・全カードの全組合せ・旧版の進行中セーブ引継ぎは未確認。TEST公開版のオンライン通信禁止は維持する。


## Ver.0.3.226 バランス定義

コマンド登録・構文・Pack APIは維持する。S/Nカードの開始時プログラムと人数別獲得量を更新。LU2はonce 3/turnで3回の独立したcastを行う。N1のchange/start/choice/moveを2セット実行し、N3は2回のtobaを設置時効果の完了後に続ける。中断可能な処理はJSON可能なinstallEffectStackで保持する。新旧効果を二重実行しない。
