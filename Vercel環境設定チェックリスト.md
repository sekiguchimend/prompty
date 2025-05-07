# Vercel環境設定チェックリスト

## 環境変数確認

- [ ] **SUPABASE_FUNC_URL**
  - 正しい値: `https://qrxrulntwojimhhhnwqk.supabase.co/functions/v1`
  - スラッシュの有無に注意（現在はURL末尾にスラッシュがない形式を使用）
  - Vercelダッシュボードで設定されているか確認

- [ ] **SUPABASE_SERVICE_ROLE_KEY**
  - Supabaseダッシュボードから正しいキーを取得して設定
  - キーの形式: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
  - 期限切れでないことを確認

- [ ] **STRIPE_SECRET_KEY**
  - Stripeダッシュボードから正しいキーを取得して設定
  - テスト環境の場合は `sk_test_` で始まるキー
  - 本番環境の場合は `sk_live_` で始まるキー

- [ ] **NEXT_PUBLIC_SUPABASE_URL**
  - 値: `https://qrxrulntwojimhhhnwqk.supabase.co`
  - アプリケーションからのSupabase接続に使用

- [ ] **NEXT_PUBLIC_SUPABASE_ANON_KEY**
  - 匿名ユーザー用アクセスキー
  - Supabaseダッシュボードから取得

## デプロイ設定確認

- [ ] **Node.js Version**
  - 推奨: Node.js 18.x以上
  - Vercelのビルド環境設定で確認

- [ ] **Build Command**
  - 正しいビルドコマンドが設定されているか確認
  - 例: `next build`

- [ ] **Output Directory**
  - Next.jsのデフォルト設定を使用しているか確認
  - カスタム設定の場合は `.next` または `out`

## 接続テスト

- [ ] **Supabase接続テスト**
  - Vercel環境からSupabaseへの接続がタイムアウトしていないか確認
  - Functionログで接続エラーを確認

- [ ] **Edge Function接続テスト**
  - 直接Edge Functionへのアクセスをテスト
  - レスポンスコードとエラーメッセージを確認

- [ ] **プロキシAPI接続テスト**
  - `/api/proxy/stripe-sync` エンドポイントへのリクエストをテスト
  - レスポンスとエラーログを確認

## Edge Function設定確認

- [ ] **Edge Function存在確認**
  - Supabaseダッシュボードで `handle_prompts_insert` 関数が存在するか確認
  - デプロイ状態を確認（「デプロイ済み」になっているか）

- [ ] **Edge Function環境変数**
  - Supabaseダッシュボードで以下の環境変数が設定されているか確認:
    - `STRIPE_SECRET_KEY`
    - `SUPABASE_URL`
    - `SUPABASE_SERVICE_ROLE_KEY`

- [ ] **Edge Functionアクセス権限**
  - JWT検証が無効化されているか確認
  - `--no-verify-jwt` オプションでデプロイされているか確認

## デプロイ後の検証

- [ ] **ログ確認**
  - Vercelのデプロイログで問題がないか確認
  - Function実行ログでエラーメッセージを確認

- [ ] **動作テスト**
  - 有料記事を投稿しStripe連携処理が動作するかテスト
  - コンソールログで詳細なエラー情報を確認 