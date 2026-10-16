# ここ領 オフラインテスト

`naninunenonano/kokoryo` の指定PRを、オフラインプレイ／Bot戦専用として配信します。
元リポジトリのブランチ・Pages設定・Supabaseは変更しません。

## 初回設定

公開先は **naninunenonano/Test-kokoryo** のみです。

1. このフォルダのファイルを、ディレクトリ構造を保って `main` に配置する。
2. テストリポジトリの **Settings → Pages → Source** を **GitHub Actions** にする。
3. ファイルの反映でActionsが自動実行される。Pages設定前に失敗した場合は、設定後に **Re-run failed jobs** で再実行する。
4. deployジョブ完了後、 https://naninunenonano.github.io/Test-kokoryo/ をSafariで開く。

初回の自動実行対象は `preview-target.json` に固定したPR #1・Ver.0.3.217・コミット
`6991bf8b664e8e4748912d3f70e43172fa1a84f4` です。

## 今後の更新

**Actions → Update offline test → Run workflow** でPR番号を入力します。expected_commitを空欄にすると、その時点のPRのheadを1度取得して固定します。
ビルダー・テスト・ワークフロー・依存関係・`preview-target.json` のmainへの更新でも自動ビルドします。
自動実行は `preview-target.json` の対象を使用するため、今後の自動実行対象も変える場合は同ファイルを更新してください。
手動実行はこの設定ファイルを書き換えません。
PRの自動マージ、元リポジトリへの書き込み、元リポジトリのActions実行は行いません。
テストURLは最新の指定PRで置き換わります。画面上のTEST表示・PR番号・コミットで対象を確認してください。

## 分離方法

- Supabase SDKを読み込まず、URLと公開キーは空に置き換える。
- オンライン入室・クライアント生成・自動再接続を無効化する。オンライン関数の本体は保持する。
- CSPの `connect-src 'none'` によって、設定や呼び出しに誤りがあっても通信接続を許可しない。
- 保存デッキ／再接続情報／利用者IDは `kokoryo_test_` のキーを使用する。公開版の保存値の読取・削除・移行をしない。
- ローカルゲーム・デバッグ・Botは元の実装を使用し、Botで未対応のパックやルールを勝手に解放しない。
- バージョン表示、PR、SHA、および全配信ファイルのハッシュを `test-build.json` に記録する。
- 上流コードの変更で無効化箇所が見つからない場合はビルドを失敗させる。公開版設定へのフォールバックはない。

「オフライン」は対戦通信をしないモードです。ページ初回表示時のHTML・画像取得にはインターネット接続が必要です。

## ローカル検証

```sh
python3 tools/build_preview.py --pr 1 --commit 6991bf8b664e8e4748912d3f70e43172fa1a84f4 --output _site
python3 -m unittest discover -s tests -p 'test_*.py' -v
node tools/check_syntax.cjs _site
npm ci --ignore-scripts
npm run test:dom
```

DOMテストはオフライン／Botの入口からドラフト・資源選択・ゲーム開始までを実行し、
オンライン接続口の拒否と公開版保存値の保持も確認します。Safariの描画・タッチ操作の検証は含みません。

Pages設定とワークフローは **Test-kokoryoだけ** で使用してください。
