# Edge Function デプロイ手順

## 1. 前提条件

Edge Functionをデプロイするには以下が必要です：

- Docker Desktop（実行中であること）
- Supabase CLI
- Supabaseアカウントと適切な権限

## 2. Docker Desktopの確認

Docker Desktopがインストールされていることを確認し、起動します。
タスクバーにDockerアイコンが表示され、「Docker Desktop is running」状態になっていることを確認してください。

## 3. Supabase CLIのインストール

```bash
# npmを使用してインストール
npm install -g supabase

# インストール確認
supabase --version
```

## 4. Supabaseへのログイン

```bash
# ブラウザが開き、認証が行われます
supabase login
```

## 5. プロジェクトへのリンク

```bash
# プロジェクト参照IDはダッシュボードのURLから確認できます
# 例: https://app.supabase.com/project/abcdefghijklmnopqrst
supabase link --project-ref your-project-ref
```

## 6. 環境変数の設定

```bash
# Edge Function用の環境変数を設定
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set SUPABASE_URL=https://your-project-url.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI...
```

## 7. Edge Functionのデプロイ

```bash
# JWTの検証をスキップしてデプロイ
supabase functions deploy handle_prompts_insert --no-verify-jwt
```

## 8. Supabaseダッシュボードでの環境変数設定

Supabaseダッシュボードの管理画面でも同じ環境変数を設定します：

1. Supabaseダッシュボードにログイン
2. プロジェクトを選択
3. 左メニューから「Settings」→「API」→「Environment Variables」を選択
4. 以下の環境変数を追加：
   - `STRIPE_SECRET_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

## 9. デプロイの確認

1. Supabaseダッシュボードの「Edge Functions」セクションで関数が表示されていることを確認
2. 「Logs」タブでエラーがないかチェック

## 10. トラブルシューティング

エラーが発生した場合は以下を確認してください：

- Docker Desktopが起動していることを確認
- 環境変数が正しく設定されているか確認
- Supabase CLIが最新版であることを確認（`supabase update`で更新可能）
- ローカルでのテスト：`supabase functions serve handle_prompts_insert --env-file ./supabase/.env.local --no-verify-jwt`

## 11. フロントエンド環境変数の設定

アプリケーション側（Next.js）で以下の環境変数を設定します：

```
# .env.local
SUPABASE_FUNC_URL=https://your-project-url.supabase.co/functions/v1
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI...
```

これにより、アプリケーションからEdge Functionを呼び出すことができるようになります。 