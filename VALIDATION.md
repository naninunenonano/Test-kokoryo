# 検証記録

対象: naninunenonano/kokoryo PR #1 / Ver.0.3.217

ソースコミット: `6991bf8b664e8e4748912d3f70e43172fa1a84f4`

## ローカルで確認した結果

- テスト環境の分離・構成検査: 11件成功。
- JavaScript構文検査: index内1本、追加パック3本、計4本成功。
- PR #1の回帰テスト: 28件成功。
- DOM実行テスト: オフラインで入口→設定→12回のドラフト選択→4人の資源配分→ゲーム開始に成功。
- DOM実行テスト: Botロビー→P1選択とBot3人の自動選択→3巡ドラフト→初期資源→ゲーム開始に成功。
- 上記の実行中にfetch・WebSocket・Supabaseクライアント生成は発生せず、接続口の直接呼出しも拒否。
- 公開版の保存デッキ・再接続データに置いた検査値は保持された。
- 追加パックJS3本とPNG画像94枚を含む配信用ファイルの存在とSHA-256を確認。
- 本番リポジトリのローカルチェックアウトは変更なし。今回、本番への書込・Pages設定変更は行っていない。

## GitHub Actionsと公開URLの確認（2026-10-16 JST）

- 公開URL: https://naninunenonano.github.io/Test-kokoryo/
- 実行記録: https://github.com/naninunenonano/Test-kokoryo/actions/runs/38859286399 （再実行2回目）
- build・deployジョブとも成功。GitHub上でも分離検査11件・構文検査4本・オフライン／BotのDOMテストが成功。
- 公開されたtest-build.jsonのPR・バージョン・ソースコミット・onlineEnabled=falseを確認。
- 公開URLからHTMLと追加パックJS3本を取得し、全4ファイルのSHA-256がビルド記録と一致。
- PNG画像94枚すべてでHTTP HEAD 200と画像のContent-Typeを確認。うち1枚はGETでも取得しSHA-256一致を確認。
- 実配信HTMLでもTEST表示、空のSupabase URL、connect-src noneを確認。実配信されたJavaScript4本の構文検査も成功。

## 実機で残る確認

CSPのブラウザ適用、iPhone Safariのレイアウト・タッチ操作・Bot戦完走は未確認。
DOMテストは実機Safariの代わりにはならない。

## 更新手順

READMEの初回設定後、Actionsの「Update offline test」でPR番号を指定する。
画面とtest-build.jsonにPR・コミットを記録する。
ビルドまたはテストが失敗した場合、deployジョブを実行しないため既存のテスト公開を置き換えない。

この準備用パッケージにはゲーム画像を同梱していない。ワークフローが指定PRから取得し、
テスト配信物にまとめるため、画像・追加パックを別途アップロードする必要はない。
