# ここ領 汎用コマンド仕様一覧

**調査基準：TEST Ver.0.3.226（2026年10月17日・JST）**

この文書は実装の調査結果であり、新しいルールやAPIの決定書ではない。今回、ゲームコード・カード定義・バージョン・公開環境を変更せず、ZIPも作成していない。

## 調査根拠・読み方

- 最新TEST main：`3e947728ee13a64b3b17b7330d62a489cb129367`。公開 `test-build.json` の版・コミットと照合。本体編集用ソース・順序定義・既存全パック／ルールJS、計13ファイルのハッシュが手元の調査対象と一致した。
- 本番 main：`2dc96523a6c447babee2e54245955e2c9935d77c`。本番への書き込みは行っていない。
- 一次資料：[コマンド実装 game.js](https://github.com/naninunenonano/Test-kokoryo/blob/3e947728ee13a64b3b17b7330d62a489cb129367/command-overrides/src/game.js)、[カード効果 card_effects.js](https://github.com/naninunenonano/Test-kokoryo/blob/3e947728ee13a64b3b17b7330d62a489cb129367/command-overrides/src/card_effects.js)、[雇用・能力 characters.js](https://github.com/naninunenonano/Test-kokoryo/blob/3e947728ee13a64b3b17b7330d62a489cb129367/command-overrides/src/characters.js)、[デッキ・Pack API decks.js](https://github.com/naninunenonano/Test-kokoryo/blob/3e947728ee13a64b3b17b7330d62a489cb129367/command-overrides/src/decks.js)、[同期 online.js](https://github.com/naninunenonano/Test-kokoryo/blob/3e947728ee13a64b3b17b7330d62a489cb129367/command-overrides/src/online.js)。
- 追加パックの一次資料：TESTが固定参照している本体ソース `1ca6ccfcf7c5f9cddea8c508f472b0af04a9167a` の [pack1.js](https://github.com/naninunenonano/kokoryo/blob/1ca6ccfcf7c5f9cddea8c508f472b0af04a9167a/packs/pack1.js)、[pack2.js](https://github.com/naninunenonano/kokoryo/blob/1ca6ccfcf7c5f9cddea8c508f472b0af04a9167a/packs/pack2.js)、[rules_pack1.js](https://github.com/naninunenonano/kokoryo/blob/1ca6ccfcf7c5f9cddea8c508f472b0af04a9167a/packs/rules_pack1.js)。現行TESTの同名ファイルと一致する。pack3.jsは調査対象の配布物に存在しない。
- 過去の `COMMANDS.md` にはVer224時点の数値・説明も残るため、**本書では現在の関数本体・登録表・呼び出し元を優先**した。
- 「実装済み」は関数として実在すること、「専用処理依存」はゲーム処理は存在しても汎用コマンドだけでは完結しないことを指す。「未実装」は対応する汎用操作／カード登録等が存在しないことを指し、両者を混同しない。

## 最初に押さえる実装上の事実

1. 現行は**JavaScript関数API**であり、`pool 自分 資金 3` のような文章を解釈するパーサーはない。効果説明文を変更しても実行処理にはならない。ブロック構文の `start … end`、`trigger … end` も実装されていない。
2. `cardCommands` は本体の共有された非公開スコープ内にある。ブラウザのグローバル変数として公開されているわけではない。追加パックのhookでは、渡される `api.commands` を使える。既存パックJSはこの新APIを直接呼ばず、主に旧 `api.resource` 等と専用処理を使っている。
3. 実行時点は呼び出し元が決める。コマンド単独では「ターン開始時」「常時」「設置時」「ターン1回」は登録されない。`trigger` も永続リスナー登録ではない。
4. ほとんどのコマンドは選択UI・描画・ログ・通信確定を自動で行わない。一部は既存処理経由で描画等の副作用を持つ。コマンドを呼んだだけでオンライン対応・Bot対応が完了するわけではない。
5. `choice` は選択結果を計算する部品、`limit`・`boost`・`discount` は数値計算の部品。命令の名前から想像される状態変更を自動で行うものではない。

# A. 実装済みコマンドの完全一覧

登録表 `const cardCommands` には**26識別子**がある。内訳は効果コマンド24種類、互換名1種類、呼び出し補助1種類。

| 正式識別子 | 用途 | 実体関数 | 種別 |
|---|---|---|---|
| pool | 資源獲得 | commandPool | 効果 |
| draw | 山札カード・負債・命令書取得 | commandDraw | 効果 |
| dice | ダイス生成・振り直し・出目操作 | commandDice | 効果 |
| limit | 手札／雇用上限の計算 | commandLimit | 効果 |
| choice | 候補から選択結果を取得 | commandChoice | 効果 |
| move | 明示した領域間の移動 | commandMove | 効果 |
| start | プレイヤー順の生成・逐次実行 | commandStart | 効果 |
| change | 資源変換・資源交換・公開場交換 | commandChange | 効果 |
| can | 条件判定 | commandCan | 効果 |
| count | 数量・資源合計の取得 | commandCount | 効果 |
| plus | 公開場の補充 | commandPlus | 効果 |
| trigger | 渡されたイベントの条件評価・効果実行 | commandTrigger | 効果 |
| koyou | ガチャ／選択雇用 | commandHire | 効果・正式名 |
| toba | コストなし設置 | commandToba | 効果 |
| once | 使用台帳の確認・消費 | commandOnce | 効果 |
| repeat | 継続関数による反復 | commandRepeat | 効果 |
| boost | 基本値への補正計算 | commandBoost | 効果 |
| function | 式／現在盤面から数値計算 | commandFunction | 効果 |
| cast | 命令配列／対応カード効果の即時実行 | commandCast | 効果 |
| copy | 登録された固有能力の一時取得 | commandCopy | 効果 |
| remove | 資源の破棄 | commandRemove | 効果 |
| discount | 設置ダイス軽減数の計算 | commandDiscount | 効果 |
| end | 現在のターンを終了 | commandEnd | 効果 |
| the end | 即時ゲーム終了 | commandTheEnd | 効果・空白を含む1識別子 |
| hire | koyouと同じ関数 | commandHire | 互換名。新規定義はkoyouを使用 |
| run | 登録済み命令を名前で呼び出す | commandRun | 呼び出し補助 |

日本語の `雇用`・`賭場` は現行の登録識別子ではない。`ban`・`reset`、独立した `levelup`・`fusion` コマンドも登録されていない。画面や説明文の「雇用」は日本語表示としてそのまま使われている。

# B. 詳細仕様

## B-0. 共通引数・対象・実行環境

textブロックの関数署名は引数説明用の表記。jsブロックは、記載した呼出し環境を前提とするJavaScriptの使用例。

### 値の対応

| 値 | 意味 |
|---|---|
| y / p / r | 資金／食料／兵力。`pool('資金',3)`は不可 |
| owner | プレイヤー添字。0がP1、1がP2。多くの関数の既定値は現在手番の`turn` |
| quantity / count / times | 通常は0以上の安全な整数。`commandQuantity`経由の値は`Number`変換後に検証される。`all`等は個別に対応する関数だけで使える |
| dieId | ダイスの`id`。配列添字ではない |
| index | 指定領域での配列添字。カード移動後は変わり得る |
| cardId | once台帳のキー。カード名ではなく、管理対象の個体を区別できるキーを呼び出し元が渡す |

### choice・move・count・function等の領域

`commandZone`が受け付ける文字列は次の9種類。任意の配列を直接渡すこともできる。

| 領域 | 中身 | 所有者指定 |
|---|---|---|
| hand | 通常手札 | 可能 |
| installed | 設置確定済みカード | 可能 |
| temporary | 仮設置カード | 可能 |
| employees | 雇用キャラクター | 可能 |
| bread | 命令書手札 | 可能 |
| market | 公開場 | 共通領域 |
| discard | 通常カード捨て札 | 共通領域 |
| deck | 通常山札 | 共通領域 |
| breadDiscard | 命令書捨て札 | 共通領域 |

所有者つき指定は `{zone:'hand',owner:1}`。負債はカード配列ではなく`commandCounts`なので、この領域指定では扱えない。文字列`players`・`resources`は`count`専用の追加対象であり、`choice`の領域名ではない。公開レジェンド置き場も文字列領域にはない。必要なら適切な候補配列を渡す。

### Pack APIのowner束縛

追加パックhook内の例では次を前提とする。各例は独立した例であり、上から全部実行するスクリプトではない。

```js
// 実際の追加パックhookが受け取る引数の中で使用する。
// hooks: { onInstall: ({owner, card, api}) => { ... } }
const C = api.commands;
const p = api.owner;
```

- `pool/draw/choice/count/can/remove/toba/cast/change` は`commandApi(owner)`がownerを初期値に埋め込む。多くは個別オプションのownerで上書きできる。
- `dice/koyou/hire/end/the end` はPack APIでは**ownerが現在手番であることを検査**する。他プレイヤーのPack APIから呼ぶと例外。
- `move/start/limit/plus/trigger/once/repeat/boost/function/copy` は登録関数をそのまま引き継ぐ。ownerが自動で束縛されるとは限らない。特にmoveは領域オブジェクト、functionは式のowner、triggerはtargetsを明示する。
- 本体内部では`const C=cardCommands`として同じAPIを使用できる。本体の直接呼び出しには上記Pack側の手番ガードがない。
- `run`は呼び出し先APIのラッパーを使うので、Pack側で`run('koyou',...)`に変えても手番制限は解除されない。

### タイミング・条件・重複の共通ルール

原則として呼び出した瞬間に実行する。条件分岐は`if(C.can(...))`等のJavaScript、使用回数は`once`の台帳、常時補正は`effectiveHireLimit`等の継続的な評価側で組み立てる。`pool`等を2回呼べば通常2回分処理され、同名カードの自動的な重複排除はない。重複可否は能力定義・呼び出し元・`instances`等が決める。

## B-1. pool — 資源獲得

```text
pool(resource, quantity, {owner=turn, source='effect', respectRestrictions=true}={})
```

- `resource`は`y/p/r`。数量は0以上の安全な整数。
- 戻り値は実際に獲得した数。対象の資源状態がなければ0。
- 通常は`gainResource`を通り、資源獲得禁止・開始時抑止を尊重する。`source`は取得理由の文字列で、獲得禁止処理が参照する。
- `respectRestrictions:false`は資源を直接加算する特例。既存の一部開始時処理の互換用であり、一般カードの標準指定にはしない。
- 対象はowner。即時・指定数量分。自動回数制限・重複排除・条件登録はない。

```js
const gained = C.pool('y', 3, {owner:p});
```

## B-2. draw — 山札・負債・命令書の取得

```text
draw(target, quantity, {owner=turn}={})
```

- `target`は`deck`（通常山札）、`command`（命令書）、`debt`（負債）。`bread`ではない。
- `deck`は現在の山札をそのまま使う。カードIDやS/Nの種類による絞り込み機能はない。手札に取得するだけで設置しない。
- `deck/command`は既存の山札再利用処理を使用。引けるものだけを取得する。
- `debt`は在庫・最終ターン禁止・負債禁止を既存`acquireDebt`で判定する。
- 戻り値は`{count, cards}`。負債の`cards`は空配列。対象ownerに即時処理し、回数制限は別途必要。

```js
const orders = C.draw('command', 2, {owner:p});
const debt = C.draw('debt', 2, {owner:(p+1)%api.playerCount});
```

## B-3. dice — ダイス生成・出目操作

```text
dice(operation, {count=1, dieId, value, delta=0, source='effect'}={})
```

| operation | 必要値 | 実処理 |
|---|---|---|
| roll | count | ランダム出目の新ダイスをcount個追加 |
| gain | count、value=1〜6の整数 | 指定出目の新ダイスをcount個追加 |
| reroll | dieId | 未使用の既存1個を振り直す。反応処理も呼ぶ |
| adjust | dieId、整数delta | 未使用1個の出目を加減。1〜6へ丸める |
| set | dieId、value=1〜6の整数 | 未使用1個の出目を設定 |
| choose | dieId、value=1〜6の整数 | 現実装ではsetと同じ。選択UIや新規ダイス獲得ではない |

新ダイスは新しいid・`used:false`を持つ。既存ダイス操作は個数を増やさずidを維持。戻り値は追加／変更したダイス配列。対象なし・使用済みなら空配列。操作対象は現在のダイス配列で、owner引数はない。countは常に検証されるが、既存1個の操作では個数指定として使われない。

**イベント上の制約：** `roll/gain`単独は`resolveReactiveRolls`を呼ばない。通常ターン開始時は呼び出し元がまとめて反応処理を呼ぶ。`reroll`だけは内部で該当1個の反応処理を呼ぶ。`adjust/set/choose`は反応しない。SSR等の出目選択追加ダイスを得る`gainSSRDie`も、現行関数内では反応処理を明示呼び出ししていない。新カードで「ダイス獲得時」を再利用する際に、この差を無視してはいけない。

```js
C.dice('gain', {count:2, value:3, source:'effect'});
const d = api.dice.find(d=>!d.used);
if (d) C.dice('set', {dieId:d.id, value:6});
```

## B-4. limit — 上限の計算

```text
limit(target, delta, {base=既定上限, count=1}={})
```

- `target`は`hand/hire`。baseの既定値はそれぞれ`gameSettings.handLimit/hireLimit`。
- delta・baseは安全な整数。deltaは負数も可。countは0以上の安全な整数。
- 戻り値は**base + delta × countという数値**。設定値もカード状態も変更しない。下限0への補正も行わない。
- owner引数・常時効果登録・自動リセットはない。呼び出し元が枚数や条件を数え、その都度上限として利用する。

```js
const value = C.limit('hire', 1, {base:5, count:2}); // 7。上限設定の書換えではない
```

## B-5. choice — 候補選択

```text
choice(target, quantity, {owner=turn, where=()=>true, select=null}={})
```

- targetはB-0の領域・領域オブジェクト・任意配列。quantityは整数または`'all'`。
- whereで絞った後の候補に対し、selectに添字配列または候補そのものの配列を渡す。添字は**絞り込み後**のもの。
- selectがnullなら先頭から最大quantity件を返す。自動的にプレイヤーへ選択画面を出す処理ではない。
- 選択数超過・重複・候補外は例外。指定数より少ない選択や、候補不足による少数取得は可能。必ず指定枚数を選べたかは呼び出し元が確認する。
- 戻り値は選択結果の新しい配列。カードを移動・設置・破棄せず、配列内オブジェクトは同じ参照。

```js
const cards = C.choice({zone:'discard'}, 1, {
  where:c=>c.type==='N', select:[0]
});
const resource = C.choice(['y','p','r'], 1, {select:[2]})[0]; // 'r'
```

キャラクターやプレイヤーも候補配列を作れば選択できる。資源の**個数配分UI**や全員分の選択待ちまでchoiceに含まれるわけではない。

## B-6. move — 明示領域間の移動

```text
move(cards, from, to, {replaceSource=false, index=null}={})
```

- cardsは1要素または配列。from/toはB-0の領域または配列。異なる所有者のemployees間などにも使える。
- 移動元に全対象があること・重複がないことを検証してから移す。移動元と移動先が同じ配列なら例外。
- index未指定なら移動先末尾、指定時はその位置へ挿入。replaceSourceは公開場専用で、元のmarketを取り除いた配列に置換する。
- 戻り値は移動した要素配列。対象カード個体のプロパティは維持される。
- **設置状態の自動判定、設置時効果、雇用確定時効果、公開場の補充は行わない。** 所有者フィールドや別管理台帳の付け替えも自動ではない。明示した配列間だけを操作する。

```js
const from = {zone:'hand', owner:p};
const picked = C.choice(from, 1);
C.move(picked, from, 'discard');
```

## B-7. start — プレイヤー順の処理

```text
start(owner, quantity='all', {queue=null, step=null}={})
```

- ownerは開始プレイヤー添字。quantityは人数以下の整数または`'all'`。
- queueなし・stepなしなら、ownerから末尾→先頭へ回るプレイヤー添字の配列を返す。
- queueなし・stepありならその順にstep(p)を即時実行する。stepが厳密にfalseを返すと打ち切る。戻り値は生成した全順序配列。
- queueありでは先頭がownerで、nが0でなくstepがある場合に**1人分だけ**stepを実行し、falseでなければqueueの先頭を除く。戻り値は成功bool。quantityをallにしても、この分岐が一度に全員を処理するわけではない。
- Promiseをawaitする機能はない。UI選択待ち・同期キューの保存はN1等の呼び出し元が実装している。

```js
C.start(p, 'all', {step:q=>C.draw('command', 1, {owner:q})});
```

この例のdrawはowner指定を受けるので全員へ配れる。同じ書き方で単にkoyouを呼んでも、雇用先は自動でqには切り替わらない。

## B-8. change — 変換・交換・公開場入替

```text
change(target, quantity='all', options={})
// 第2引数が配列でないオブジェクトなら、それをoptionsとして扱う。
```

| target | 別名として認識する日本語 | 主なoptions |
|---|---|---|
| convert | 資源変換 | owner, kind, dieId, index, color, allowAny, source, undo, record |
| exchange | 資源交換 | owner, from, to, rate, gain, rollbackBlocked, source, undo, record |
| market | 公開場 | owner, cost |

### convert

kindは`die`または`command`として使う。dieは未使用dieId、commandは命令書手札indexを指定。出目1/2→y、3/4→p、5/6→r。命令書ANYにはcolorが必要。通常は対応色以外を拒否し、ダイスの神の恩恵またはallowAny指定で別色を許可する。命令書の別色指定にもallowAnyが使われる。

ダイスの基本獲得量はquantity省略／allなら3、数値指定ならその数。命令書はquantityにかかわらず2。ダイスだけconversionBonusを加える。ownerが現在手番でなければ例外。ダイス使用済み化／命令書破棄を行い、獲得禁止後の実取得数を返す。**禁止で取得0でも、通常は支払い済みになる。**

```js
const d = api.dice.find(d=>!d.used);
if (d) C.change('convert', 3, {dieId:d.id});
if (api.breadHands[p].length) C.change('convert', {
  kind:'command', index:0, color:'y'
});
```

### exchange

from/toは異なるy/p/r。rate未指定は通常3、等価交換が有効なら1。gain既定1。rate/gainは0以上の安全な整数として検証される。quantityは交換比率を設定する引数ではない。支払資源がなければ失敗。獲得禁止で取得0のとき、rollbackBlocked:trueなら支払いを戻す。

```js
C.change('exchange', {from:'p', to:'y', rate:3, gain:1});
// 通常ルール・等価交換を共通評価する場合はrateを省略する。
```

### market

quantityは`'all'`・入替対象の枚数・対象を選ぶ配列。数値指定は先頭からその枚数のカードであり、種類数ではない。costの資源を持つことを確かめ、選択カードを捨て札へmoveしてplusで現在の上限まで補充。上限値自体は変更しない。Undo禁止化やダイアログはUI側等が担当する。

```js
C.change('market', 'all');
```

変換／交換の戻り値は成功時`{ok:true,amount,...}`、不成立時`{ok:false,amount:0}`。公開場交換は移動カード配列、資源不足時false。undo:trueは既存Undo履歴へ記録、record:trueは既存プレイログへ記録するオプション。全操作に共通のトランザクション保証はない。

## B-9. can — 条件判定

```text
can(target, condition, {owner=turn, value}={})
```

conditionは判定関数、または`installed/temporary/special/hire-space`。

- installed/temporary：ownerの該当配列にtargetがあるか。
- special：target.specialがvalueと一致するか。
- hire-space：ownerの雇用数がeffectiveHireLimit(owner)未満か。
- 判定関数の場合はcondition(target)の真偽。未知の条件名は例外。

戻り値はbool。組込条件は状態を変えない。任意コールバックの純粋性はAPIで強制されない。コスト全体や「通常カードなら何でも設置可能」を判定する汎用条件はない。

```js
const card = api.installed[p][0];
if (C.can(card, 'installed', {owner:p})) C.pool('y', 1);
```

## B-10. count — 数の取得

```text
count(target, condition=()=>true, {owner=turn}={})
```

- 通常領域／配列：condition(card)に一致する要素数。
- players：0〜playerCount-1のうちcondition(player)に一致する人数。
- resources：ownerの資源をcondition(個数,資源キー)で絞り、**個数を合計**する。資源の種類数を返すものではない。
- 戻り値は呼び出し時点の数値。後の移動・増減を自動追跡しない。必要なら再呼び出しする。

```js
const before = C.count({zone:'installed', owner:p}, c=>c.key==='S5');
const total = C.count('resources', ()=>true, {owner:p});
```

## B-11. plus — 公開場補充

```text
plus(target, quantity='max')
```

targetは`market`のみ。maxは現在の公開場設定数まで既存refillMarketで補充する。数値はその**種類数**を目標に補充し、既存カードを減らさない。通常山札・捨て札の再利用を使い、供給が尽きれば終了。戻り値はmarket配列。

owner指定・公開場以外の補充・上限設定変更はない。枚数指定のchoice/changeとは数量の単位が違う。

```js
C.plus('market'); // 現在の上限へ。Ver226の標準は12種類
```

## B-12. trigger — イベント照合

```text
trigger(event, context, {
  event:expected=event, targets,
  when=()=>true, instances=()=>1, match=()=>true,
  aggregate=false, effect
}={})
```

- event/expectedは照合するイベント文字列。現在の本体接続は`install`と`dice-acquired`。API自体は他の文字列も比較できるが、未接続の文字列を指定しても自動検出は始まらない。
- context.itemsがあればmatch(item)に合う個数をhitsとする。itemsがなければhits=1。
- targets未指定は全員。when(owner,context)に合い、instances(owner,context)が0でない所有者へ発動。
- 回数はhits×instances。aggregate:falseはその回数だけeffectを呼ぶ。trueは所有者ごとに1回、合計occurrencesを渡す。
- effectへowner/hits/count/occurrences等を渡す。通常反復ではhits/count/occurrencesを1にしindexも渡す。戻り値はeffectの結果配列。
- **リスナーの保存、イベント生成、使用回数制限、重複排除は行わない。** 呼び出し元が同じイベントを二度渡せば二重に処理される。

```js
C.trigger('install', {actor:api.turn}, {
  targets:[p], when:(owner,ctx)=>owner!==ctx.actor,
  effect:({owner})=>C.pool('y', 1, {owner})
});
```

## B-13. koyou — 雇用（正式名）

```text
koyou(mode, quantity, {
  accept=e=>finalizeHire(e),
  canHire=()=>cardCommands.can(null,'hire-space'),
  selected=null, pool=null
}={})
```

- modeは`gacha/select`だけ。quantityは0以上の安全な整数。`'all'`や日本語操作名は受け付けない。
- gachaは1回ごとにgachaCastを呼ぶ。selectはselected[i]を取り、候補poolに同じidが含まれるかを調べ、浅いコピーをacceptに渡す。
- selectのpool未指定はN/R/SR/SSR/URのimplementedCastPoolをまとめた候補。ここでの`UR`は内部のレアリティ値で、カードIDのCURに対応する。CLRは既定候補に含まれない。
- canHireは各回の前に評価する。受取先を指定するowner引数は**ない**。既定処理は現在手番のemployeesへ入る。
- 戻り値はacceptへ渡した雇用データの配列。acceptの返り値は成功判定に使わないため、カスタムacceptが配列に追加しなくても返却配列には含まれ得る。
- コスト・通常雇用1回制限・選択UI・レベルアップ・融合はこの関数だけでは実行されない。詳細はD参照。

```js
// 効果によるガチャ雇用。通常雇用の支払い・回数消費を意味しない。
C.koyou('gacha', 1);
```

選択雇用は候補を先に作る。本体内部で実在する候補関数を利用する例：

```js
const pool = ['N','R','SR','SSR','UR'].flatMap(r=>implementedCastPool(r));
const selected = cardCommands.choice(pool, 1, {select:[0]});
cardCommands.koyou('select', 1, {pool, selected});
```

## B-14. toba — コストなし設置

```text
toba({owner=turn, card=null, from=null, created=false}={})
```

- card省略は現在の山札から1枚引く。山札・捨て札がなければnull。
- card指定では、通常は明示したfromに存在する必要がある。created:trueは新しく作ったカード等の移動元検査を省略する内部用。
- fromから取り除き、registerInstallation(owner,card)を呼ぶ。**仮設置**へ追加し、納税等の設置反応とresolveOnInstallを処理する。通常の設置コスト・雇用枠等の設置条件の再検査はしない。
- 戻り値はカードまたはnull。1回の呼び出しは1枚。N3の2枚やLU3の4回・選択待ちは別の継続処理が担当。
- 選択UIや非同期効果の完了までをawaitする契約はない。すべてのレジェンド取得効果を再現するAPIでもない。LL4等の追加処理やLU1のゲーム終了など、takeLegend側で別途呼ばれる処理はtoba単独には含まれない。

```js
const c = C.choice({zone:'hand', owner:p}, 1)[0];
if (c) C.toba({card:c, from:{zone:'hand', owner:p}});
```

## B-15. once — 使用台帳

```text
once(limit, period, {cardId, usage, owner=null, consume=false}={})
```

- limitは0以上の安全な整数。periodは`turn/game`。usageとcardIdは必須。
- owner=nullはusage[cardId]、owner指定時はusage[owner][cardId]を読む。旧形式usage[owner]===trueならその所有者の全体を使用済みとして扱う互換処理がある。
- trueの保存値は1回、それ以外は数値化して使用回数とする。上限未満ならtrue、到達済みならfalse。
- consume:falseは確認のみ。trueなら台帳を進める。上限1はtrue、上限2以上は数値で保存する。
- **period文字列によって台帳が自動リセットされるわけではない。** 現行ではbeginTurn等が既存台帳・個体プロパティをリセットする。任意台帳を渡した新カードにも同じ仕組みが自動で用意されるわけではない。
- 個体独立性は個体IDと台帳の選び方で確保する。同名を共通キーにする使い方は個体別管理にならない。個体オブジェクト自身をusageとして使う方式も既存雇用で採用している。

```js
// APIの確認例。ゲーム中の継続利用には台帳の保存・ターン更新側の初期化が別途必要。
const usage = {};
C.once(1, 'turn', {usage, cardId:'card-instance-a', consume:true}); // true
C.once(1, 'turn', {usage, cardId:'card-instance-a'});              // false
C.once(1, 'turn', {usage, cardId:'card-instance-b'});              // true
```

## B-16. repeat — 継続関数付き反復

```text
repeat(times, {index=0, step, done=()=>{}}={})
```

times/indexは0以上の安全な整数。index>=timesならdone。各回でstep(index,next)を呼び、nextが呼ばれたとき次へ進む。同じnextの2回目以降は無視する。

stepがnextを呼ばなければ待機できるが、Promiseの自動await、選択モーダル、タイムアウト処理、オンラインへのコールバック保存はない。戻り値はstep／doneの結果。同期でnextを連続実行する場合は再帰なので無制限の大回数処理向けではない。

```js
C.repeat(2, {step:(i,next)=>{C.draw('deck',1); next();}});
```

ブロックの終了記号はない。`end`を繰り返しの終端記号として使ってはいけない。LU3は再開番号等を別状態へ保存している。

## B-17. boost — 効果量の計算

```text
boost(base, amount, {count=1, stack='add'}={})
```

baseとamountは有限数。amountは数値または配列。通常は`base + 合計(amount)×count`、stack='max'は`base + max(0,...amount)×count`。countは非負整数。負のamountによる減少も計算できる。戻り値は数値。

対象プレイヤー・期間・カードへの補正登録・永続変更はない。stackの明示利用値はadd/maxで、実装ではmax以外は合計分岐になる。能力の重複禁止を自動判定しない。

```js
const income = C.boost(3, 3, {count:1}); // 6
```

## B-18. function — 動的計算

```text
function(expression, context={})
// プロパティ名なので C.function(...) として呼べる。
```

expressionが関数ならexpression(context)の結果を返す。オブジェクト形式の項目：

| 項目 | 既定値 | 役割 |
|---|---|---|
| target | 'installed' | 領域／配列 |
| owner | turn | 対象所有者 |
| where | ()=>true | 対象を絞る |
| value | ()=>1 | 各要素から数値を得る |
| multiplier | 1 | 合計への倍率 |
| divisor | 1 | 除数 |
| flat | 0 | 加算値 |
| round | 'none' | floor/ceilなら指定の丸め。それ以外は無丸め |

計算は`合計(value)×multiplier/divisor + flat`の後に丸める。戻り値だけでVPやカードデータを自動更新しない。cardVP等の再評価経路へつなぐ必要がある。式の数値や除数を包括的に検証する関数ではないため、利用側で有限値・適切な除数を保証する。

```js
const bonusVP = C.function({
  target:{zone:'installed',owner:p},
  where:c=>c.key==='S5', value:()=>3
});
```

## B-19. cast — 効果の即時実行

```text
cast(program, {owner=turn, times=1}={})
```

- programが配列なら`[[コマンド名,...引数], ...]`として、times回の外側ループ内で順にrunする。
- カードオブジェクトを渡す場合はnormalEffectProgram(card,owner)から命令列を取得。現行対応はmine/farm/barracks、greatermine/greaterfarm/greaterbarracks、commandroom/greatercommand、church、banditの**10 special**のみ。それ以外はnull。
- 明示命令列のownerオプションは各命令に自動注入されない。別プレイヤー対象なら各命令の引数にもownerを渡す。
- timesは非負整数。戻り値は実行結果を平坦に並べた配列。条件判定・once・非同期選択待ち・巻き戻しは自動ではない。途中例外までに行った変更も自動で取り消さない。
- `repeatTurnStartEffect`は、このcastに加えてパックhookや一部specialを専用に扱っている。castだけで全カードの全効果を再発動できるわけではない。

```js
C.cast([
  ['pool','y',3,{owner:p}],
  ['draw','command',1,{owner:p}]
], {times:2});
```

## B-20. copy — 固有能力の一時取得

```text
copy(name, {applyStart=false}={})
```

nameはUNIQUE_ABILITY_DEFSに登録された能力名。登録がない・コピー不可ならfalse。能力プロファイルのコピーを返し、`copiedAbility=name`を設定する。firstBreadBonusとoverclockResourcesは返すプロファイルから除く。

- 対象は現在手番の単一コピー枠。owner・任意カード効果・複数能力を追加保存する機能はない。再呼び出しは前の名前を上書きする。現在は次のbeginTurnでクリアする。
- applyStart:trueはturnBread、invisibleHand、deadMansTriggerに対応するドローを即時適用。他の全開始時効果を汎用的に再実行するものではない。
- オーバークロック、無限の黄金、クレシェンティア・ギフテッドは現定義でコピー不可。
- 場から候補を集める／選択する／onceを確認する処理はLU6の専用制御側。copy自体は、指定能力を場の誰かが持つかを調べない。

```js
const profile = C.copy('神算鬼謀', {applyStart:true});
// この呼び出しの開始時ドローは通常分2枚。初回追加4枚は付かない。
```

## B-21. remove — 資源破棄

```text
remove(target='all', {owner=turn, quantity='all'}={})
```

targetは`all`・単一のy/p/r・それらの配列。quantityはallまたは非負整数。数値は**各指定資源につきその数**を上限に捨てる指定で、全資源合計での破棄数ではない。残量を超えれば残量まで。戻り値は`{資源キー:捨てた数}`。

資源を直接減らす。カード・雇用・負債の除去命令ではない。負債の返却等は旧Pack APIや専用関数で処理している。

```js
const removed = C.remove(['y','p','r'], {owner:p, quantity:2});
```

## B-22. discount — 設置コスト軽減の計算

```text
discount(target, kind, amount, {sources=[], remaining=null}={})
```

target='install'・kind='dice'のみ。amount、sources各要素、remainingは非負整数。`amount + 合計(sources)`を返す。remaining指定時はその差を0以上にした残数を返す。

ダイスを消費したり、カードに軽減能力を登録したりしない。実際のおねだりはlordInstallDiceDiscount→設置候補・支払いの既存処理と組み合わせている。軽減の重複方針・適用対象も呼び出し元が決める。

```js
const remaining = C.discount('install','dice',1,{remaining:2}); // 1
```

## B-23. end — ターン終了

```text
end()
```

現在手番のcompleteEndを呼ぶ。ownerや回数指定はない。通常の終了・時計・オンライン権限経路へつながる。コマンドだけで全ての未解決UI・任意コールバックを必ず解決できる保証はないため、LU5等は必要な前処理をしてから呼ぶ。

```js
C.end();
```

## B-24. the end — 即時ゲーム終了

```js
C['the end']()
// または C.run('the end')
```

現在ゲームのfinishGameを呼ぶ。通常の最終ターン開始やターン終了とは異なる。owner・数量・条件・onceはない。LU1の即時終了で使用する。空白を含む1識別子であり、`the`と`end`に分割する構文はない。

## B-25. hire — 互換名

署名・値・戻り値・制限はkoyouと完全に同じ関数。新規カードの正式名にはkoyouを使う。

```js
C.hire('gacha',1); // 実在する互換名。新規ではC.koyouを推奨
```

## B-26. run — 名前による呼び出し

```text
run(name, ...args)
```

name前後の空白を削除し、連続空白を1つにして登録名を照合する。登録されていない名前とrun自身の再帰指定は例外。引数の型や回数は呼び出された各コマンドが処理する。戻り値もその結果。

```js
C.run('  the   end  '); // 'the end'として即時ゲーム終了
```

`run('pool 自分 資金 3')`のような文章の解析や、日本語名から英語名への変換は行わない。

# C. 汎用処理とカード固有処理の対応

「部品共通」は実際に汎用コマンドを使う箇所があること。「専用制御」は候補生成・対象条件・コスト・UI・タイミング・継続状態などにカード／能力別のコードが残ること。部品が共通でも、すべてを効果テキストから生成できる状態とは判定しない。

## C-1. 現行スタンダード1（全37種類）

| ID・名称 | 実際の共通部品 | 専用処理依存・境界 |
|---|---|---|
| S1 作戦計画書 | once・dice reroll | useStdAbilityの個体・対象UI、開始時台帳リセット |
| S2 人員調整書 | once・dice adjust | 同上。±指定と候補UI |
| S3 制限令 | once・dice set | 同上。出目1への設定 |
| S4 特別許可書 | once・dice set | 同上。出目6への設定 |
| S5 鉱山 | pool・boost・function | specialの開始時プログラム、LL1有無、cardVPへの接続 |
| S6 農場 | pool・boost・function | S6/LL2を判定する接続 |
| S7 兵舎 | pool・boost・function | S7/LL3を判定する接続 |
| S8 司令室 | draw command | 開始時走査・設置コスト制御 |
| S9 倉庫 | limit hand | handLimitで設置・仮設置の個数を数える |
| S10 教会 | draw deck | 開始時走査・設置コスト制御 |
| N1 ナーロッパランド | change・start・choice・move・plus（change内部） | installEffectStack、2セット、他者の選択待ち、UI、Bot、選択リビジョン同期は専用 |
| N2 領主会議 | draw command | resolveLordMeetingInstallとdistributeLimitedByQuotaが人数順・5/2枚・在庫配分を担当 |
| N3 開拓ラッシュ | toba | installEffectStackが2回・連鎖・N1待ちを担当。toba単独の反復機能ではない |
| N4 大鉱山 | pool・can・move | 上位施設の設置済み元カード判定とダイス不要支払いはinstallBalancedCard等 |
| N5 大農園 | pool・can・move | 同上 |
| N6 要塞 | pool・can・move | 同上 |
| N7 大司令部 | draw command・can・move | 同上 |
| N8 飢饉 | trigger | resolveReactiveRollsがイベント・該当出目・設置個体数を指定。負債は直接acquireDebt、資源はgainResource |
| N9 徴兵令 | trigger | 同上 |
| N10 ナロパカルタ | trigger | 同上 |
| N11 オルフェンズ | can・choice・move・once | 使用コスト・選択モーダル・失効確認・個体台帳はuseGraveyard |
| N12 納税 | trigger・count・pool | triggerLandGrabが設置イベントを接続。人数別量はplayerScaledGain |
| N13 義賊 | count・pool／cast | 資源合計8以上の対象判定と人数別量をnormalEffectProgram等で指定 |
| N14 交易場 | can・choice・move・plus・once | 資金2、取得後の1枚破棄、キャンセル・失効確認はusePublicMarket |
| N15 スカウト | can・move・koyou | 設置済み確認、再抽選、hiredThisTurnとhireBreadはuseScoutのaccept処理 |
| LL1 ミスリルラッシュ | boost・function | 対応S5限定の接続、取得支払いはtakeLegend。固定6VPとS5の+3VPを別計算 |
| LL2 ゴールデンフィールド | boost・function | S6限定。同上 |
| LL3 エインヘリヤル | boost・function | S7限定。同上。N4〜N6は補正しない |
| LL4 ビギニング・オブ・レジェンド | choice・koyou select | chooseNamedHireForLegendのUI／候補条件。acceptは直接employeesへ追加し、既定finalizeHireは使わない |
| LL5 ジェネシスワールド | start・choice・move | まず自己1枚、その後全員各1枚、対象領域と選択はresolveScorchedEarth等 |
| LL6 メモリークラッシュ | start・count・choice・move・draw・pool | 各人の対象枚数・負債を残す処理・半分切捨てはresolveGreatRefresh |
| LU1 クラレント | the end | 同じ出目6個の支払いと即時終了呼出しはtakeLegend |
| LU2 ユグドラシル | once・cast | 合計3回、各回の対象UIと候補判定はresolveMayQueen／repeatTurnStartEffect。hook等のフォールバックも専用 |
| LU3 創世記 | repeat・choice・toba | 手札／公開場候補、4回、待機と再開番号の保存はresolveEggHarp |
| LU4 シークレット・サーティーン | choice・move・limit | 他者雇用選択・取得処理とeffectiveHireLimitへのspecial接続 |
| LU5 神々の黄昏 | can・toba・start・remove・end | ターン開始時の特殊取得、下位カードの状態判定はofferFreeResourceWipeLegend |
| LU6 パーフェクト・イミテーション | once・choice・copy | 場の能力候補・選択・開始フェイズの再開はresolveAbilityCopyLegend。現在はinstalled.findで最初の1個体を処理し、コピー枠も1つ |

通常カードのコストについてはBALANCED_INSTALL_COSTS・installBalancedCard等の共通処理もあるが、これは上記登録26識別子の新コマンドではない。対象specialの表に依存する設置用共通ヘルパーである。

## C-2. 雇用・領主・UI

| 対象 | 共通部分 | 専用部分／未統一部分 |
|---|---|---|
| CN/CR/CSR/CSSRの資源・ダイス系 | pool・dice、選択資源キュー | continueBeginTurnで属性を読んで処理。全キャラクターが命令配列化されているわけではない |
| CUR1 神の贈り物／対応領主 | dice・pool | 共通UNIQUE_ABILITY_DEFS。追加ダイス数・任意資源選択・開始時キューの制御 |
| CUR2 等価交換／対応領主 | change exchange | exchangeRateForが有効ソースを判定。1:1を重ねて0:1等にはしない |
| CUR3 おねだり／対応領主 | discount | ソース集計・ダイス不要選択肢・実支払いとの接続 |
| CUR4 神算鬼謀／対応領主 | once・draw | 個体別の初回フラグ、通常分2＋初回4、開始時の評価 |
| CUR5 オーバークロック／対応領主 | once・pool | 個体別初回20、配分キュー・UI。choiceだけで20個配分は完結しない |
| CUR6 神の見えざる手／対応領主 | draw・choice・move・pool | 開始時ドローと起動時の手札破棄UI・ソース数集計 |
| リクリエイション | can・choice・move・toba | VP差±2、レジェンド除外、選択と交換はuseRecreation等の専用処理 |
| 無限の黄金 | groupedCharacterVPでfunctionを利用 | 能力プロファイル・VP10・コピー不可等は能力別定義 |
| 神の恩恵 | dice・change | 追加2ダイス・変換ボーナス2・任意色の接続は能力／変換側 |
| 神託 | once・koyou select・move | 選択肢、段階表、費用、通常雇用との排他、個体履歴はuseOracleUpgrade等 |
| 貢ぎ物 | once・toba・draw | ソース個体の回数・選択UI、手札からの無料設置 |
| デッドマンズトリガー | draw等の取得部品 | 通常2＋命令2と起動操作のタイミング／UI。全体を単一命令列で表す構造ではない |
| CLRの能力取得 | 共通能力定義を再利用 | 素材条件・2能力選択・合成・保存は専用処理 |
| 資源変換・資源交換UI | change | 対象ダイス／命令書／色選択、Undo、ログと再描画 |
| 公開場入替UI | change | 資源各1の費用チェック、Undo禁止、描画等 |

同名能力の共通定義はあるが、`stackable`の説明だけで全命令が自動的に重複排除されるわけではない。実際の合算・最大値採用・真偽判定は各ソース集計関数を確認する必要がある。

## C-3. 追加パック通常カード（現在のID）

既存pack1.js/pack2.jsには`api.commands`の呼び出しが見当たらず、汎用コマンドAPIを利用できることと、既存パックが移行済みであることは別である。

| ID・名称 | 現行経路 | 汎用コマンド移行の判定 |
|---|---|---|
| N16 緊急補充人員 | fieldAction、api.addDebt/hireNamedN、_usedThisTurn | 旧Pack API・個体フラグ依存。koyou/once未統一 |
| N17 借り入れ | fieldAction、api.addDebt/resource | 同上。once/pool未統一 |
| N18 バブル崩壊 | onInstall、api.addDebt/distributeDebt | 旧配分API。draw/startの登録命令列ではない |
| N19 債務不履行 | onInstall、api.clearDebt/resource、最終ターン判定 | 旧APIとhook。removeは資源専用で負債処理を代替しない |
| N20 連帯保証 | onInstall、api.removeDebt/distributeDebt | 旧負債API依存 |
| N21 自転車操業 | fieldAction、api.useDie/removeDebt/resource | 旧API・固有支払いUI |
| N22 夜逃げ | installNightEscape、個体初回履歴のリセット制御 | 専用。汎用resetコマンドはない |
| N23 徳政令 | onInstall、clearAllDebt(api) | 旧負債API依存 |
| N24 債務回収 | fieldAction、api.resource、_usedThisTurn | 旧API・個体フラグ依存 |
| N25 カルテル | onInstallの全員ループ、api.resource | 旧API。start/poolの登録命令列ではない |
| N26 一斉採用 | resolveOnInstall massRecruitment、gachaCast/finalizeHire/drawBread | 専用。全員雇用はkoyouに未統合 |
| N27 レベルアップ | resolveOnInstall castLevelUp、oneStepUpgradeCast | 専用。koyouのlevelup操作はない |
| N28 確定ガチャ | resolveOnInstall等の固有経路、packCastPool/finalizeHire | 専用。koyouのUR保証操作はない |
| N29 受け入れ準備 | effectiveHireLimitでhireCapacityの場の枚数を数え、limitへ渡す | limit部品は共通。常時ソース登録はspecial依存 |
| N30 円満退職 | resolveOnInstall等、nextHireMinRarity、雇用側の追加分岐 | 専用。解雇／次回保証はkoyouの独立操作ではない |
| N31 ハニートラップ | 専用対象選択・他者employeesからsplice | move/choice未統一 |
| N32 トレード | 専用対象選択・employees間の直接交換 | move/choice未統一 |
| N33 W雇用 | useDoubleHire→hireEmployee、2人目はgachaCast/finalizeHire | 通常雇用部分はkoyou経由、効果全体は専用 |
| N34 サプライズスペシャルガチャ | 専用候補選択→finalizeHire | koyou selectへ未統一 |
| N35 派遣会社 | finalizeHire内のstaffingAgency分岐 | 汎用雇用イベントtriggerへ未統一 |

ここでは効果が説明文どおり完全に動作することまでは判定していない。とくに雇用経路ごとにfinalizeHireの通過有無が違い、雇用時の付随効果も同じではない。

## C-4. 追加パックレジェンド・ルール

| 対象 | 現行方式と専用依存 |
|---|---|
| LL7 マネーロンダリング | moneyLaunderingの取得／起動処理。登録コマンドだけの定義ではない |
| LL8 好景気・LL9 不況 | turnStart hook、旧resource/addDebt API、特殊VP設定。共通命令列へは未移行 |
| LU7 摩天楼・LU8 黄金時代・LU9 世界恐慌 | specialConfig・特殊取得フェイズ・資源／負債禁止・dynamicSpecialVP等の専用共通エンジン。can/function等だけでは置換できない |
| LL10 大企業・LL12 ナーロッパ祭 | 特殊VP・上限判定のspecial分岐。汎用function/limitだけのデータ定義ではない |
| LL11 特需 | resolveOnInstall specialProcurement等の専用入力・資源加算 |
| LU10 ナーロッパギルド | cardVP等のspecial別可変VP処理 |
| LU11 アーレア・ヤクタ・エスト | 追加ロール等の固有起動処理 |
| LU12 ナーロッパワーク斡旋所 | 雇用の解雇・再抽選・個体更新の固有処理 |
| RC1 市場流動化 | ルールhookのdiscardMarketAndRefill |
| RC2 暗黒時代 | ルールhookのaddDebt |
| RC3 買い手市場 | 雇用支払いとeffectiveHireLimitのhasActiveRule分岐 |
| RC4 超好景気 | 開始時資源選択キューへの固有接続 |
| RC5 成長促進 | synthesisOptions/synthesizeCastの素材数分岐。CLR融合は対象外 |

前回報告の既知事項：LL10〜LL12の宣言されたコスト（facesExact/freeResourceCost等）をそのまま処理する取得分岐がtakeLegendに見当たらない。汎用コマンドが用意されていることを理由に、これらの取得処理を対応済みとは扱わない。今回は修正・実UI再現をしていない。

# D. 雇用コマンドの現状と拡張候補

## D-1. 現行の構造

通常雇用は次の役割分担になっている。

1. **hireEmployee**：手番権限・通常雇用済み・上限を確認。通常は資金5と未使用ダイス1個を消費。買い手市場なら費用を省く。
2. **koyou('gacha',1)**：候補抽選とcanHireチェックをしてacceptへ渡す。
3. hireEmployeeの**accept**：次回レアリティ保証、同名能力CUR再抽選、hiredThisTurn更新を実行。
4. **finalizeHire**：ドッペルゲンガーの能力コピー、employeesへの追加、hireBreadやstaffingAgency等の付随処理、通知と描画。

koyouを直接呼ぶと手順1やhireEmployee固有の手順3は行わない。LL4・N15・神託ではacceptも差し替えており、全経路で同じ雇用確定処理を実行する構造にはなっていない。

| 雇用関連操作 | 処理自体 | koyou正式操作 | 主な入口 |
|---|---|---|---|
| 通常のガチャ雇用 | 実装済み | gacha | hireEmployee＋koyou |
| 選択雇用 | 実装済み | select | LL4等。UI・候補作成は別 |
| 他プレイヤーへの雇用 | 専用処理で存在 | owner/targets引数なし | N26がturnを一時変更してfinalizeHire |
| N27の1段階レベルアップ | 実装済み | 未実装 | oneStepUpgradeCast＋直接置換 |
| 神託のレベルアップ | 実装済み | 専用操作は未実装 | 専用表・費用・回数＋koyou select/move |
| 通常融合・モノマネ師素材融合 | 実装済み | 未実装 | synthesisOptions/synthesizeCast |
| CLR融合・能力選択 | 実装済み | 未実装 | clrFusionOptions/chooseLRAbilities等（内部名LR、正式表記CLR） |
| 解雇 | 実装済みの専用経路あり | 未実装 | dismissEmployee等、各カード処理 |
| UR保証・次回最低レアリティ保証 | 専用経路あり | 未実装 | N28/N30等とhireEmployeeの分岐 |
| 雇用所有者の移動・交換 | 専用処理＋move利用箇所あり | 未実装 | LU4、N31/N32等 |

**結論：融合はゲーム機能として既にあるが、雇用コマンドの操作には集約されていない。** 「今後追加する操作」は、ここではkoyouへの統合を意味し、ゲーム内の処理が全く存在しないという意味ではない。

## D-2. ガチャ・選択雇用の実際の候補

- ガチャ率は内部N60%／R20%／SR11%／SSR6%／UR3%。対象パックの有効状態、synthesisOnly、同一人物CURの除外等をimplementedCastPoolで扱う。候補なしのレアリティは再抽選。
- select既定候補も同じ通常候補プールを使用。CLRや合成限定を自動で含む選択allはない。
- poolを明示すると、その候補に同idがあるかの確認になる。神託のように、通常候補ではない生成済みの後継個体を受け入れる内部用途がある。カスタムpoolを渡しても通常の除外条件を全て再検査する仕組みではない。
- quantity回のループ中にcanHireを毎回呼ぶ。acceptがemployeesを更新すればその上限に追従する。select候補配列自体は実行開始時に作るため、複数回の選択中のユニーク条件を自動で全て再計算する契約ではない。
- 全レアリティの候補が空ならrollCastRarityのwhileループに終了条件がない。候補が存在する通常のゲーム状態を前提とする。

## D-3. レベルアップ処理の違い

| 項目 | N27《レベルアップ》 | 神託 | 融合 |
|---|---|---|---|
| 対象 | 自分の雇用1人を専用UIで指定 | 専用の対応表にある雇用 | 指定された素材個体群 |
| 変化 | N→R→SR→SSR。allowUR:false | 固定表。SSRはドッペルゲンガー等の例外 | CAST_SYNTHESIS／CLRルールによる生成 |
| 生成 | oneStepUpgradeCast。対応先がなければ次レア候補から抽選 | oracleUpgradeTargetで既定個体 | 素材条件・模倣素材・能力選択等 |
| 支払い | カードの設置費用側。効果内の追加雇用費用処理なし | ダイス1＋資金5 | 専用融合のルール |
| 回数 | 設置時効果の呼出しに依存 | 各能力個体につきターン2回、通常雇用との排他あり | fusionUsedThisTurnによるターン1回 |
| 置換・履歴 | 生成個体をapplyUniqueAbilityDefしてstaffへ直接代入 | 自身が対象のとき使用履歴を引き継ぐ特例等 | 素材を除去し生成個体を追加。CLR選択待ちあり |

単にmodeに新しい名前を追加してN27専用処理を呼ぶだけでは、これらの条件差や所有者、付随処理が共通化されたことにはならない。

## D-4. 拡張箇所・候補（未実装の提案）

以下は**設計候補であり現行APIではない**。操作名・引数名は未確定として扱う。

| 拡張対象 | 必要になる対応 |
|---|---|
| commandHireの操作選択 | 現在のgacha/select検査・実行分岐を拡張。レベルアップ・融合を同じkoyouの操作として扱える余地はあるが、現在は呼ぶとUnknown hiring mode |
| 対象所有者 | owner/対象群を明示して、turnを一時変更しなくても候補・雇用枠・確定効果を同じ対象へ処理できるようにする |
| commandApi(owner) | 現在のkoyou手番限定ガードを、他者への「カード効果による雇用」と通常操作権限を区別する方式へ整理する必要 |
| 候補／生成の分離 | 通常ガチャ・選択候補・次レア候補・既定昇格先・融合先を再利用可能な処理として分離。カードID専用分岐を共通コマンド内へ移すだけにしない |
| 確定処理 | finalizeHireの対象所有者と、初回効果・雇用時効果・派遣会社・ドッペル・通常雇用回数の適用方針を明示する |
| レベルアップ | 1個体の検査→生成→元個体置換を共通化。SSR→CUR可否、固定昇格／抽選、使用履歴維持／新個体化は既存の各ルール差を保存する |
| 融合 | 素材の重複禁止・不足確認・モノマネ・成長促進・CLR能力選択を独立部品化。選択後の再検査をしてから素材をまとめて消費する |
| 回数と費用 | once等に接続しつつ、通常雇用・神託・融合が持つ異なる消費時点と台帳を維持する |
| UI／非同期／同期 | 対象選択結果と継続状態をJSON化して保存。関数コールバックを同期データへ入れない。ホスト検証・再送・再接続・Botも同じ仕様へ接続する |
| 旧互換 | hire互換名・旧Pack APIの呼出し先を整理。旧経路と新koyouを二重実行しない |

JavaScriptの引数オブジェクト・共通レジストリ・Pack APIは拡張可能な形になっているので、技術的に統合先を設けることは可能。ただし、現時点で「レベルアップ・融合まで対応済み」とは判定できない。

# E. 新S13〜S15への対応状況

## E-0. ID登録の前提

現行のSカードは**S1〜S10**で、`CONTENT_ID_LIMITS.S`も10。S13・S14・S15はSTD_BASEや実行対象として登録されていない。現行のN26/N27/N29が新S13/S14/S15へ自動的に読み替えられる仕組みもない。

新IDの追加はデータを置くだけでは足りない。既存のS用設置UIは`type==='S'`を先に処理し、installStandardは既知specialを想定している。Sカードへの移行では、予約範囲・カード定義・枚数・設置経路・効果タイミングの接続を確認する必要がある。今回はいずれも変更していない。新しいコスト・VPも推測して設定していない。

## E-1. S13《一斉採用》

| 効果要素 | 判定 |
|---|---|
| 全員の順序を作る | startで可能 |
| 各人のガチャ雇用を抽選する | koyou gachaの抽選部品はある |
| 各対象プレイヤーへ正しい雇用確定効果まで実行 | **未対応**。koyouにownerがなく、Packの他者koyouはガードされる |
| 人数の取得・命令書の付与 | count players・draw commandで構成可能。対応表は呼出し元のJS条件分岐で必要 |
| 既存の全員雇用動作 | N26の専用massRecruitment分岐として存在。koyou経由ではない |
| 新S13として登録・動作 | **未実装** |

N26の現行枚数は2人で1枚、3人で2枚、4〜6人で3枚を設置者へ渡す。これは現行比較先の値であり、今回提示された新S13の効果文だけを根拠に新カードの数値・コスト・VPを追加決定したものではない。

**そのまま使えない例：** startのstep内で単にkoyouを呼んでも雇用先は各プレイヤーにならない。`koyou('gacha',1,{owner:q})`も、現行ではownerが引数として定義されておらず無視される。必要な拡張はD-4の対象所有者と確定処理。

## E-2. S14《レベルアップ》

| 効果要素 | 判定 |
|---|---|
| 自分の雇用から1人を選ぶ | choice employeesで選択結果を作る部品はある。選択画面は別 |
| 次のレアリティ／個体を生成 | oneStepUpgradeCast等の既存ヘルパーはある |
| 元雇用から次個体への移動・置換 | move等の部品はあるが、前後の検査・履歴方針・確定が必要 |
| koyouのレベルアップ操作 | **未実装**。現行はgacha/selectのみ |
| 既存N27のレベルアップ | 専用処理で存在。神託は別の規則と専用経路 |
| 新S14として登録・動作 | **未実装** |

koyou select＋カスタムacceptを使って置換する実例は神託にあるが、「レベルアップ操作が汎用コマンドとしてある」とは扱わない。新S14の段階上限・例外・費用・履歴について、N27と神託のどちらを採用するかを推測で補完しない。

## E-3. S15《受け入れ準備》

| 効果要素 | 判定 |
|---|---|
| 雇用上限＋1の計算 | limit hireで可能。ただし呼ぶだけでは上限は変わらない |
| 常時、枚数分重複 | N29のhireCapacity→effectiveHireLimitが既に実装。各個体を1枚ずつ数える |
| 盤面から離れた際の補正消失 | 現行は評価時に盤面を数え直すので追従する |
| 仮設置の扱い | 現行allFieldCardsは設置＋仮設置を含む。N29の枠増加も仮設置時から有効 |
| 新S15として登録・動作 | **未実装**。ID・S用設置経路との接続が必要 |

3種のうち、**効果処理の流用が最も進んでいるのはS15**。現行と同じhireCapacityの常時評価を使う方向なら、上限増加の重複部品を新設する必要はない。ただし新S15を登録し、仮設置時から有効とするか等の最終仕様に合わせて接続する作業は残る。使用回数制限を追加する効果ではないので、onceの新規適用は不要。

# F. 未実装・制約・提案の整理

## 実装済みとして使えるもの

- Aの24効果コマンド＋hire互換名＋run補助。
- 本体内呼出し、Pack hook向けapi.commands。
- 既存のコスト・候補・能力定義・雇用／レベルアップ／融合の各専用ヘルパー。
- N1/N3/LU3等の**既存カード向け**継続・同期処理。

## 未実装、または自動化されていないもの

| 項目 | 現状 |
|---|---|
| 効果文／日本語コマンド列のパーサー | なし |
| コマンドブロックと終端記号 | なし。endはターン終了 |
| koyouのlevelup／fusion／解雇等の正式操作 | なし。専用ゲーム処理とは別 |
| koyouのowner／全プレイヤー指定 | なし |
| choiceの汎用選択UI・任意資源配分UI | なし。配列選択部品のみ |
| start/repeat/castの一般的な非同期処理・同期継続の自動保存 | なし。既存カード専用の再開制御が担当 |
| triggerの永続イベント登録・雇用イベント共通化 | なし |
| dice roll/gainからの反応イベント自動発火 | なし。呼出し側の接続が必要 |
| limit/boost/discountの継続効果登録 | なし。数値を返すのみ |
| onceの任意台帳の自動ターン／ゲームリセット | なし |
| castによる全カード・全タイミングの任意再発動 | なし |
| copyによる任意カード効果コピー・複数コピー枠 | なし |
| removeによるカード／雇用／負債の除去 | なし。資源専用 |
| ban/resetという正式コマンド | なし。禁止や履歴初期化の専用ゲーム処理は存在する |
| 新S13/S14/S15のカード登録 | なし |

## 調査中に確認した再利用上の注意

- 通常雇用・LL4・N15・N26・神託・融合は確定経路が違う。既定finalizeHireの通過有無だけでも、雇用時効果・再抽選・個体履歴の扱いが変わる。
- N26の現行専用分岐は全員を順に抽選し、turnを一時変更してfinalizeHireを呼ぶ。koyou既定の雇用上限チェックと同じ経路ではない。新S13を作る際に、単にこの分岐を共通コマンド名で包むだけでは問題が残る。
- finalizeHireのstaffingAgency処理は現在手番側の場を走査している。N35の「他プレイヤーが雇用するたび」という説明と、イベント対象を汎用的に定義する構造は一致していない。今回は変更・実UI再現をしていない。
- LU6の既存候補選択は最初の設置個体を使い、copyの保存先も単一。onceが汎用的に個体台帳を扱えることと、LU6の複数個体を独立したコピー枠として実装済みであることは別。
- 上記の調査結果は修正案を独断で確定するものではない。既存の正常動作を保ったまま、次回の統合仕様で対象・費用・履歴・付随効果を決める必要がある。

# G. 調査の検証範囲

- 最新TEST mainと公開版の版／コミットを取得し、調査ソースのハッシュを照合した。
- 登録表と各関数本体、主要な呼び出し元、既存の追加パック・ルールJSを読んだ。旧資料の名称や想定引数だけで実装済みと判断していない。
- 独立したメモリ上のゲーム環境で、limitが設定を変えないこと、choiceの先頭選択、onceの台帳挙動、dice gain/reroll/chooseの差、koyouのowner未対応・操作名の拒否・Pack手番ガード、S13〜S15未登録を確認した。進行中のゲームや保存データは操作していない。
- 本書の使用例は現在のJS引数形式に合わせたAPI例。候補・ダイス・資源・手番等の必要なゲーム状態がある場面で呼ぶ前提。一般ユーザーが説明文へ貼り付けて動くDSLではない。
- 実サーバー通信・実機操作・全カードの通し対戦を今回新たに検証したものではない。前回ビルドやテストの合格を、今回のAPI制約や未統合箇所が存在しない根拠にはしていない。
- 今回行った書き込みはこの仕様書等の調査資料のみ。ゲームコード変更、バージョン更新、コミット／マージ／公開操作、ZIP作成は行っていない。

# 付録：登録コマンドとは別に存在する旧Pack API

以下も現行コードに存在する再利用入口だが、Aの登録コマンドとは別物。新規命令が増えたと誤認しないよう区別する。出典はdecks.jsのpackRuntimeApi。

| メンバー／メソッド | 署名・役割 |
|---|---|
| owner / commands | 対象所有者／owner束縛付きのコマンドAPI |
| turn / playerCount | 現在手番／人数のgetter |
| powers / commandCounts / dice | 資源・負債・現在ダイスへのgetter |
| hands / installed / temporary / employees / breadHands / discard | ゲーム配列へのgetter。直接参照であり、読取専用の複製ではない |
| debtSupply() | 負債の残り在庫 |
| isFinalTurn() | 最終ターン開始済みまたはゲーム終了済みか |
| canHire() | **現在手番**の雇用枠判定。owner束縛で他者を判定する形ではない |
| hireNamedN(id) | 現在手番へ指定N雇用を確定。koyouの正式操作ではない |
| notice(msg) / redraw() | 通知の追加／描画 |
| resource(p,key,delta,source='effect') | 正のdeltaはgainResource、負のdeltaは残量検査して減らす |
| setResources(p,next) / clearResources(p) | 資源値の設定／全破棄 |
| debt(p) / addDebt(p,n=1) | 負債数の取得／制限に従った負債獲得 |
| distributeDebt(target,n=1) | API ownerを起点とした負債配分 |
| distributeCommandsByQuota(target,quota) | API ownerを起点とした命令書の割当配分 |
| removeDebt(p,n=1) / clearDebt(p) | 負債を在庫へ返却。負債破棄禁止も参照 |
| useDie(id) | 現在の未使用ダイスを使用済みにする |
| useAnyCost(choice) / useNumberCost(choice,value) | ダイス／命令書の既存支払い部品 |
| drawBread(p=owner) | 命令書を対象へ1枚 |
| drawCard() | 通常山札から1枚を取り出す。手札追加までは行わない |
| install(p,card) | registerInstallation。移動元から取り除く処理は含まない |
| discardInstalled(p,index) | 設置確定済みカードを捨て札へ |
| completeTurn() | 現在のcompleteEndを呼ぶ |
| cardPool(rarity) | packCastPoolの候補取得 |

ルールカードhookには、これとは別の小さなapi（discardMarketAndRefill／addDebt／notice）が渡る。ルールhookのapiを、そのまま全てのカード用Pack APIと同じとみなしてはいけない。
