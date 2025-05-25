# 分析用テーブルのマイグレーション

このディレクトリには、アナリティクス機能に必要なテーブルを作成するためのマイグレーションファイルが含まれています。

## analytics_viewsテーブルの作成

### 実行方法

1. Supabaseダッシュボードにログインする
2. 対象のプロジェクトを選択
3. 左メニューから「SQL Editor」を選択
4. `create_analytics_views_table.sql`の内容をコピー
5. 「New Query」をクリックして、クエリエディタにペースト
6. 「Run」をクリックしてSQLを実行

### 実行後の確認事項

1. 左メニューから「Table Editor」を選択
2. `analytics_views`テーブルが作成されていることを確認
3. テーブルの列名とデータ型が以下の通りであることを確認:
   - `id`: UUID (プライマリキー)
   - `prompt_id`: UUID
   - `user_id`: TEXT
   - `ip_address`: TEXT
   - `user_agent`: TEXT
   - `referrer`: TEXT
   - `viewed_at`: TIMESTAMP WITH TIME ZONE

4. ユニーク制約が設定されていることを確認:
   - `prompt_id`と`user_id`の組み合わせがユニーク

## エラーが発生した場合

### スキーマキャッシュの問題 (PGRST204)

エラーメッセージ: `Could not find the 'user_id' column of 'analytics_views' in the schema cache`

#### 解決方法1: スキーマキャッシュのリフレッシュ

1. Supabaseダッシュボードの「Settings > Database」メニューへ移動
2. 「Database Settings」セクションで「PgBouncer」タブを選択
3. 「Refresh schema cache」ボタンをクリック
4. またはプロジェクトの再起動を試みる

#### 解決方法2: テーブルの再作成

1. `check_analytics_table.sql`を実行して実際のテーブル構造を確認
2. テーブルを再作成するためにダッシュボードで以下のSQLを実行:

```sql
-- テーブルを削除して再作成
DROP TABLE IF EXISTS analytics_views;

-- テーブルを再作成
CREATE TABLE analytics_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL,
  user_id TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  viewed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_view UNIQUE (prompt_id, user_id)
);

-- インデックスを作成
CREATE INDEX idx_analytics_views_prompt_id ON analytics_views(prompt_id);
CREATE INDEX idx_analytics_views_viewed_at ON analytics_views(viewed_at DESC);

-- RLSを有効化
ALTER TABLE analytics_views ENABLE ROW LEVEL SECURITY;

-- ポリシーを設定
CREATE POLICY "Allow insert" ON analytics_views FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow admin select" ON analytics_views FOR SELECT TO authenticated USING (auth.role() = 'service_role' OR auth.role() = 'supabase_admin');
```

#### 解決方法3: アプリケーションコードの修正

`src/lib/analytics.ts`ファイルのコードでは、スキーマキャッシュの問題に対応するため、以下の対策が実装されています:

1. `upsert`の代わりに`select`と`insert`の組み合わせを使用
2. エラー発生時に代替のカラム名で再試行する仕組み

### Reload方法

1. Supabaseダッシュボードでテーブル作成/再作成を実行後:
2. ブラウザのDevToolsを開き「Application」タブから「Local Storage」をクリア
3. ブラウザをハードリロード (Ctrl+F5またはCmd+Shift+R)
4. キャッシュクリアとリロードを試す

## 使用方法

`analytics_views`テーブルは、ページビューを記録するために使用されます。同じユーザーが同じプロンプトを複数回閲覧しても、カウントは1回だけ増加します。 