# TEST Ver.0.3.229

《等価交換》4仕様の変更と今回の検証結果は docs/VER229_REPORT.md を参照。ZIPの全ファイルの変更有無は FILE_CHANGES.tsv に記載。

# TEST Ver.0.3.228

Ver227の読み違いを訂正。初期手札はドラフト5枚、標準の手札上限は10枚。領主共通資源3個を維持。本番は変更しない。詳細は `docs/VER228_REPORT.md`。

# TEST Ver.0.3.227

初期手札を10枚（既存ドラフト5枚＋山札5枚）、ターン開始時の領主共通資源を3個へ修正。固有能力の追加分とカード効果は維持。本番は変更しない。詳細は `docs/VER227_REPORT.md`。

# TEST Ver.0.3.226

スタンダード1の30種類を調整。詳細は [docs/VER226_REPORT.md](docs/VER226_REPORT.md)。本番は変更しない。

# TEST Ver.0.3.225

標準設定：勝利30VP・初期資源10・雇用5・公開場12・レジェンド上下5・8枚提示の5巡ドラフト（初手5枚）。任意設定は優先。カード効果と汎用コマンドはVer224から変更しない。詳細は [docs/VER225_REPORT.md](docs/VER225_REPORT.md)。現行S40枚では6人戦の8枚提示に8枚不足するため、将来のデッキ増量まで開始前に不足を表示する。

以下は以前の版の記録。

# TEST Ver.0.3.224

レジェンド・雇用・領主・UIの共通コマンドと基本ルールの更新。現行仕様は [docs/COMMANDS.md](docs/COMMANDS.md) のVer.0.3.224節、検証結果は [docs/VER224_REPORT.md](docs/VER224_REPORT.md) を参照。TEST専用・本番Ver.0.3.220は変更しない。

# ここ領 TEST Ver.0.3.222 — 汎用コマンド 第1段階（本番未反映）

Ver.0.3.221 の分割構成を基準に、旧S1〜S10の内部処理をpool・draw・dice・limitへ置換します。カード、ルール、画面、Bot判断、オンライン仕様を変更しません。
APIの名称・引数・使用カード・既存の資源獲得経路の差は [docs/COMMANDS.md](docs/COMMANDS.md) を参照してください。
本番 main / GitHub Pages へはマージせず、開発ブランチと別TESTリポジトリで確認します。

## 構成

| ファイル | 担当 |
| --- | --- |
| index.html | 従来のHTML/CSS。元のscript位置から配信JSを読み込む |
| src/game.js | 共通状態、資源・ダイス・命令書、ターン進行、終了判定、持ち時間 |
| src/card_effects.js | 通常・スタンダード・レジェンドの固有効果 |
| src/characters.js | 領主・雇用データ、能力、雇用・解雇・融合・コピー |
| src/decks.js | カード・デッキデータ、山札・公開場、パック・ルールの登録/API |
| src/ui.js | 描画、カード詳細、ボタン・選択表示 |
| src/bot.js | 既存Botの判断と進行 |
| src/online.js | ルーム、Supabase、同期、オンラインの時計確定 |
| src/debug.js | 既存デバッグ、診断、プレイログ |
| src/bootstrap.js | 起動呼び出し、既存イベント・タイマー登録、末尾ハンドラ |
| src/order.json | 分割前の実行順序・クロージャ境界・照合ハッシュ |
| js/app.js | 自動生成する実行用JS。直接編集しない |
| packs/*.js | 独立した追加パック・ルールJS。今回は変更なし |
| docs/DEPENDENCIES.md / dependencies.json | 移動先と保守的な参照関係の台帳 |

表示と効果が混ざった既存関数は、中身を書き直さず担当ファイルへ丸ごと移します。
通常のscriptを9本に増やすと共有変数と初期化順が変わるため、ビルドで元の1つのスコープへ戻します。
これはビルド時の連結であり、実行時evalや新たなグローバル化は行いません。
SDK → pack1 → pack2 → rules_pack1 → app の順に同期読み込みします。追加したappのURLにはバージョンを付けます。

## 編集・検査

Node.js 24で実行します。

```sh
npm ci --ignore-scripts
npm run build
npm run analyze
npm test
```

編集対象はsrc以下です。既存のセクションマーカーは保持してください。
新しいセクションはsrc/order.jsonの適切な位置へ登録します。未登録・重複・欠落・セクション外コードはビルドで失敗します。
CIは追跡済みapp.jsがソースと一致するかを検査し、古いbundleをそのまま通しません。
バージョン更新時はindex.htmlとsrc内の従来のバージョン表記を更新し、build/analyzeを実行します。

検査はVer.0.3.221の保存済み関数との挙動比較と、既存コードの変更範囲の照合を行います。
移行した4関数と共通コマンド以外の処理は、バージョン表記を除き変更を許可しません。
tools/split_once.cjsは固定した元のindex.htmlから移行を再現するための一度限りのツールです。通常編集時には再実行しません。

## TEST公開

naninunenonano/Test-kokoryo の「Update offline test」で、対象PR番号と必要に応じて期待コミットを指定します。
TESTビルダーはソースとbundleの一致を確認後、配信用app.jsに従来の接続禁止・保存キー分離を適用します。
本番互換のソースを変更せず、TESTではSDKなし・接続先なし・CSP connect-src noneを維持します。
分割形式のTEST表示は元の本体バージョンを使い、二重に時計を追加しません。

TEST配布ZIPは起動済みの隔離ビルドです。編集用srcも同梱しますが、通常buildだけではTEST用の隔離処理は再適用されません。
改めて公開・配布する場合は必ず上記TESTワークフローを経由してください。TEST用HTMLのCSPとSDK削除も削除しないでください。
tools/package_test.pyは検証済みTEST成果物から、バージョン番号フォルダ・全パックJS・全分割JS・画像を含むZIPを作り、全エントリを現在のJST日時にします。

pack3.jsは基準リポジトリに存在しません。今回新設しません。存在するパック1・2とルールJSは変更なしで同梱します。

## 検証の限界

既存92件に共通コマンドの単体検査、新旧比較、通常Bot進行、4クライアント同期検査を追加します。
動的eval、Pack API、Bot、同期の状態形式は同じコードを実行します。
TESTでのオンライン接続は禁止したままです。オンラインは模擬4クライアントで確認し、本番の部屋やSupabaseは操作しません。
全カードの全組合せ、iPhone Safariの実機操作・見た目、実Supabase複数端末対戦は未検証です。
