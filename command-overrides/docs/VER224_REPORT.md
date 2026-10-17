# TEST Ver.0.3.224 実装・検証報告

更新基準：TEST Ver.0.3.223 / main `35b4384f98cd153873230fa05f95c53a6bd9e1d5`。
本番 `naninunenonano/kokoryo` main `2dc96523a6c447babee2e54245955e2c9935d77c`（Ver.0.3.220）には変更しない。

## 実装結果

正式24コマンドをsrc/game.jsのcardCommandsへ登録。新規はrepeat/boost/function/cast/copy/remove/discount/end/the end、hireの正式呼称をkoyouへ移行し、既存コマンドを拡張。hireは旧TEST用の互換エイリアスとして残す。日本語のコマンド識別子は使わない。追加パックにはpackRuntimeApi(owner).commandsで公開する。

| 対象 | 結果 | 実装場所 |
|---|---|---|
| LL1〜LL3 | boost/function。開始時の対象施設の収入と現在盤面のVPを参照 | card_effects.js / game.js |
| LL4 | choice/koyou選択雇用。CLR除外・容量制限と既存確定処理維持 | card_effects.js |
| LL5 | start/choice/move。自分の先行破棄→既存順で全員、設置時効果なし | card_effects.js |
| LL6 | start/count/move/draw/pool。各人の破棄枚数を固定取得、負債を保持 | card_effects.js |
| LU1 | the endで既存の終局と時計停止 | card_effects.js / game.js |
| LU2 | 個体別once2回、各回choice/cast | card_effects.js |
| LU3 | repeat4回、choice/toba。N1の全員選択中は次の設置を待つ | card_effects.js / game.js |
| LU4 | choice/move/limit。雇用個体の履歴を保持して所有者変更 | card_effects.js / characters.js |
| LU5 | can/toba/remove/end。特殊取得条件・資源破棄・ターン終了 | card_effects.js |
| LU6 | once/choice/copy。初回限定なし、コピー禁止を維持 | characters.js / game.js |
| CN〜CSSR | 共通staff処理のpool/dice。合成専用の資源系列も同じ処理 | characters.js / game.js |
| CUR1〜CUR6 | 領主と共通定義、CUR共通選択ダイスは別処理 | characters.js / game.js / card_effects.js |
| P1〜P24 | 既存12能力を共通定義とコマンドに接続。男女同じ定義 | characters.js / card_effects.js |
| UI4操作 | サイコロ・命令書変換、交換、公開場更新をchangeへ統一 | ui.js / bootstrap.js |
| S1〜S10/N1〜N15 | 既存の汎用化を維持。新旧比較と個体別回数・同期・Bot回帰検証 | commands.cjs / normal_commands.cjs |

コスト・カード本来のVP・その他の条件は、今回指定された能力強化以外は変更していない。レジェンドの移動と設置は区別。IDを持たない設置個体にも共通の識別子を付与し、複数ユグドラシルで回数台帳が共有されないようにした。選択済みの旧コールバックによる二重発動も抑止する。

## 基本ルール・能力強化

| 項目 | Ver.0.3.224 |
|---|---|
| サイコロ変換 | 1個→対応資源3、1/2資金・3/4食料・5/6兵力 |
| 命令書変換 | 1枚→対応資源2、万能は資源選択 |
| 資源交換 | 3:1、等価交換は同じ処理で1:1 |
| 公開場更新 | 既存の各資源1の費用、全交換。コマンドは枚数・対象指定も可能 |
| 神の贈り物 | 追加ランダムダイス2・選択資源3（領主共通資源1は別） |
| 神算鬼謀 | 命令書2・各個体の初回追加4 |
| オーバークロック | 各個体の初回に合計20、自由配分 |
| 神の見えざる手 | 各ソース通常2枚・手札1枚破棄で資源2。既存の重複維持 |
| リクリエイション | VP差±2。レジェンド対象外をtypeでも明示判定 |
| 神の恩恵 | 追加ダイス2、ダイス変換3+2=5。命令書に補正なし |
| 神託 | 各個体2回/ターン。通常雇用との排他と支払費用維持 |
| デッドマンズトリガー | 通常2枚・命令書2枚。既存の手札破棄→命令書操作も維持 |
| 無限の黄金 | ゴルド10VP、マイン10VP、雇用固有能力無効化を廃止 |
| 確定済み雇用率の変更漏れ | N60/R20/SR11/SSR6/UR3。URは本体だけでも排出 |

勝利20VP、初期資源4、領主の共通資源1、未確定のS/N再番号・パック2本体統合等は変更しない。

## 検証結果

| 検証 | 結果 | 範囲 |
|---|---|---|
| npm run build / build:check | 合格 | src/order.jsonの順で共有IIFEを構築、生成物一致 |
| npm run analyze | 合格 | 539関数・737バインディングの依存関係を更新 |
| npm test | 合格154件 | S/N回帰、LL/LU、雇用・領主数値、個体別初回、選択、コピー、再発動、軽減、繰返し、終局、UI、模擬同期、Bot |
| TEST隔離・ビルダーPython | 合格23件 | 通信禁止、本番保存領域分離、改変許可ファイル、CIのPR非公開ガード |
| 配布用JS構文 | 合格13ファイル | app、全編集用JS、既存パックJS |
| 配布用DOMスモーク | 合格2経路 | オフライン設定→ドラフト→初期資源→開始、Bot設定→ドラフト→開始 |
| 配布用持ち時間 | 合格33件 | Ver224の変換量・補正、時間切れの待機解決と一度だけ終了 |
| 実サーバーでのオンライン対戦 | 未確認 | TEST公開物は従来どおりオフライン/Bot専用。4つの独立DOMと模擬通信では検証済み |
| iPhone Safari実機/UI全操作 | 未確認 | jsdomでのDOM操作に限る |
| 人間による設定から終局までの通し対戦 | 未確認 | 開始経路、通常Botターン、特殊終局、最終ラウンドは個別自動検証 |
| 全カード・全能力の全組合せ | 未確認 | 代表的な重複・キャンセル・在庫切れ・同期順序は検証済み |
| Ver223の進行中セーブ引継ぎ | 未確認 | 新しい対戦と同版のJSON同期を対象 |

一時的な不合格は、旧変換量や強化前の数値を期待していたテストと、追加テストの初期状態・期待値を修正し、最終実行では解消。未確認事項を合格に含めない。

## 変更ファイル・配布

本体index.html、src/game.js、src/card_effects.js、src/characters.js、src/ui.js、src/bootstrap.js、src/bot.js、src/decks.jsを変更。生成js/app.js、依存関係資料、コマンド仕様、README、テスト・固定比較データ、配布用package_test.pyも更新。
TEST側のtools/build_preview.py、preview-target.json、tests/test_preview.py、tests/clock.cjs、READMEを更新し、command-overridesに累積ソースを保存する。

バージョン表記・ログ出力名のみ変更：src/online.js、src/debug.js。
変更なし：src/order.json、packs/pack1.js、packs/pack2.js、packs/rules_pack1.js、全画像、既存CSS・カード画像・基本デッキID。online.js/debug.jsのゲーム処理は前段の実装を維持する。pack3.jsは現行リポジトリに存在しないため同梱対象なし。
ZIP直下は0.3.224/。index.htmlの名前を維持し、全既存パック、ルールJS、app、編集用src、画像、ビルドツール・資料・テストを同梱する。全ZIPエントリに作成時のJSTを設定し、展開データとビルドのSHA256を照合する。

本番導入は未実施。実機・実オンライン等の未確認事項が残るため、今回の自動テスト合格だけで本番導入条件を満たしたとは扱わない。

## 汎用コマンド化の未対応一覧

ソースを確認したLL1〜LL6・LU1〜LU6、スタンダード1のCN〜CUR、現存領主P1〜P24、再調査したN1〜N15について、汎用化の**未対応なし**。これは上記の未確認の実機・対戦検証まで完了したという意味ではない。

| ID | 名称 | 未対応の効果 | 未対応の理由 | 必要な対応 |
|---|---|---|---|---|
| 該当なし | 確認済み対象 | 未対応なし | — | 実機・実オンライン・通し対戦の未確認検証は別途必要 |
