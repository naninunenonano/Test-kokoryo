# 依存関係・移動台帳

基準: `2dc96523a6c447babee2e54245955e2c9935d77c` / Ver.0.3.220。

全関数・変数は元の共有クロージャに残る。ファイルの記載順ではなく `src/order.json` が初期化・イベント登録・タイマー登録順を決める。

| 編集用ファイル | 関数宣言数 | 他ファイルへの参照候補 |
| --- | ---: | --- |
| game.js | 103 | bot.js, card_effects.js, characters.js, debug.js, decks.js, online.js, ui.js |
| decks.js | 34 | card_effects.js, characters.js, debug.js, game.js, ui.js |
| characters.js | 81 | card_effects.js, debug.js, decks.js, game.js, online.js, ui.js |
| ui.js | 78 | bot.js, card_effects.js, characters.js, debug.js, decks.js, game.js, online.js |
| debug.js | 30 | bot.js, card_effects.js, characters.js, decks.js, game.js, online.js, ui.js |
| card_effects.js | 81 | characters.js, debug.js, decks.js, game.js, online.js, ui.js |
| bootstrap.js | 2 | bot.js, debug.js, decks.js, game.js, online.js |
| online.js | 109 | bot.js, card_effects.js, characters.js, debug.js, decks.js, game.js, ui.js |
| bot.js | 24 | card_effects.js, characters.js, debug.js, decks.js, game.js, online.js, ui.js |

参照一覧は `dependencies.json`。保守的な識別子抽出であり、ローカル変数の同名を含む可能性がある。動的 `eval`（オンライン状態適用）・追加パックのフック・`window` 登録は静的解析だけでは完全に解決できない。

## 保持する境界

- 既存の関数名・変数名・宣言の種類・関数本体は変更しない。
- SDK → pack1 → pack2 → rules_pack1 → app の読み込み順を維持。
- `window.KOKORYO_PACKS` / `KOKORYO_RULE_PACKS` と Pack API を維持。
- 本体は既存のIIFE内、末尾の画面ハンドラは従来どおりIIFE外。新たな公開グローバルは作らない。
- 非同期コールバック、Bot待機、時計のリース、オンラインの動的変数参照も同じスコープを参照する。
- 保存キー・保存形式・画像パス・カードIDは変更しない。
- pack3.js は基準リポジトリに存在しないため、空のパックや新しい登録処理を追加しない。
