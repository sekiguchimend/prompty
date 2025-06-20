-- analytics_viewsテーブルの作成
-- 既存のテーブルが存在する場合は削除して新規作成（開発環境用）
DROP TABLE IF EXISTS analytics_views;

CREATE TABLE analytics_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID NOT NULL,
  user_id TEXT NOT NULL, -- ログインユーザーの場合はauth.uid()、非ログインユーザーの場合はクライアント生成ID
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  viewed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- ユニーク制約（同じユーザーが同じプロンプトを閲覧しても1回だけカウント）
  CONSTRAINT unique_view UNIQUE (prompt_id, user_id)
);

-- インデックス（他のテーブルと同様のパターンで作成）
CREATE INDEX idx_analytics_views_prompt_id ON analytics_views(prompt_id);
CREATE INDEX idx_analytics_views_viewed_at ON analytics_views(viewed_at DESC);

-- RLS (Row Level Security) ポリシーの設定
ALTER TABLE analytics_views ENABLE ROW LEVEL SECURITY;

-- 閲覧データの挿入は認証ユーザーでなくても可能（匿名ユーザーも閲覧記録可能）
CREATE POLICY "誰でも閲覧データを挿入可能" ON analytics_views
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- プロンプト作者は自分のプロンプトの閲覧データを参照可能
CREATE POLICY "プロンプト作者は閲覧データを参照可能" ON analytics_views
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM prompts
      WHERE id = analytics_views.prompt_id AND author_id = auth.uid()
    )
  );

-- 管理者は全ての閲覧データを参照可能
CREATE POLICY "管理者は全閲覧データを参照可能" ON analytics_views
  FOR SELECT TO authenticated
  USING (auth.role() = 'service_role' OR auth.role() = 'supabase_admin'); 