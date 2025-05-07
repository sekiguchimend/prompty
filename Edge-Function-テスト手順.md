# Edge Function テスト手順

## 1. Edge Function単体のテスト

Edge Functionが正常に動作しているかを単体でテストします：

```bash
# cURLを使用してテスト
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -d '{"record":{"id":"test-prompt-id"}}' \
  https://qrxrulntwojimhhhnwqk.supabase.co/functions/v1/handle_prompts_insert
```

レスポンスを確認し、エラーが発生していないか確認します。

## 2. プロキシAPIのテスト

Next.jsのローカル開発環境でプロキシAPIをテストします：

```bash
# プロキシAPIをテスト
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -d '{"record":{"id":"test-prompt-id"}}' \
  http://localhost:3000/api/proxy/stripe-sync
```

ローカル環境のコンソールに出力されるログを確認し、Edge Functionとの通信状況を確認します。

## 3. 環境変数確認

Vercel環境の設定を確認する手順：

1. Vercelダッシュボードにログイン
2. プロジェクト設定を開く
3. 「Environment Variables」タブを選択
4. 以下の環境変数が正しく設定されているか確認：
   - `SUPABASE_FUNC_URL`: "https://qrxrulntwojimhhhnwqk.supabase.co/functions/v1"（末尾のスラッシュに注意）
   - `SUPABASE_SERVICE_ROLE_KEY`: 正しいサービスロールキーが設定されているか確認

## 4. ログの確認

デプロイ後の問題を診断するために、Vercelのログを確認します：

1. Vercelダッシュボードでプロジェクトを選択
2. 「Deployments」タブを選択
3. 最新のデプロイを選択
4. 「Functions」タブでAPI関連のログを確認
5. 特に `/api/proxy/stripe-sync` へのリクエストを確認
6. 認証ヘッダーの存在と転送が正しく行われているか確認

## 5. ダイレクトテスト（Vercel環境）

Vercel環境に直接リクエストを送信してテスト：

```bash
# Vercelのプロキシエンドポイントに直接リクエスト
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -d '{"record":{"id":"test-prompt-id"}}' \
  https://your-vercel-app.vercel.app/api/proxy/stripe-sync
```

このテストにより、Vercel環境での問題を特定できます。

## 6. フロントエンドでの認証ヘッダー検証

フロントエンドから送信される認証ヘッダーを確認するためのテスト：

1. ブラウザのデベロッパーツール（Network タブ）を開く
2. 有料記事の投稿を実行
3. `/api/proxy/stripe-sync` へのリクエストを探す
4. リクエストヘッダーに `Authorization: Bearer ...` が含まれているか確認
5. レスポンスステータスコードが `200 OK` であることを確認

## 7. 解決策の適用

テストの結果に基づいて、以下の解決策を適用します：

1. 環境変数の修正
   - `SUPABASE_FUNC_URL`の末尾のスラッシュを確認（追加または削除）
   - サービスロールキーの更新

2. 認証ヘッダーの追加
   - フロントエンド側で `supabase.auth.getSession()` を使用してアクセストークンを取得
   - プロキシAPI側で受け取った認証ヘッダーを転送、または `SUPABASE_SERVICE_ROLE_KEY` を使用

3. デプロイ後の確認
   - 修正を適用後、デプロイを実行
   - 再度ログを確認し、エラーが解消されたか確認
   - テストリクエストを送信して動作確認

## 8. トラブルシューティング

認証関連の問題が解決しない場合は、以下の追加診断を検討：

1. Edge Functionのデプロイオプション
   - `--no-verify-jwt` オプションでデプロイされていることを確認
   - Supabase Dashboardでデプロイ設定を確認

2. 認証トークンの検証
   - アクセストークンの有効期限を確認
   - トークンの内容を [jwt.io](https://jwt.io) で検証

3. フォールバック認証の確認
   - プロキシAPIがサービスロールキーを正しく使用しているか確認
   - サービスロールキーの権限を確認 