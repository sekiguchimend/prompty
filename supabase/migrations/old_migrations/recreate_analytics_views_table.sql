-- analytics_viewsテーブルを完全に再作成するための最小限のSQL

-- 既存のテーブルを削除（テーブルが存在する場合）
DROP TABLE IF EXISTS analytics_views;

-- 非常にシンプルなテーブルを作成（必要最小限のカラムのみ）
CREATE TABLE analytics_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL,
  visitor_id TEXT NOT NULL,  -- ユーザー識別用（user_idという名前を避ける）
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- ユニーク制約も基本的なもののみ設定
  CONSTRAINT unique_analytics_view UNIQUE (prompt_id, visitor_id)
);

-- 基本的なインデックスを作成
CREATE INDEX idx_analytics_views_prompt_id ON analytics_views (prompt_id);

-- RLSを有効化
ALTER TABLE analytics_views ENABLE ROW LEVEL SECURITY;

-- 最低限のポリシーを設定
CREATE POLICY "Anyone can insert analytics" 
  ON analytics_views FOR INSERT 
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Admins can select analytics" 
  ON analytics_views FOR SELECT 
  TO authenticated
  USING (auth.role() = 'service_role' OR auth.role() = 'supabase_admin');

-- テーブルをrefreshしてスキーマキャッシュに確実に反映させる
NOTIFY pgrst, 'reload schema'; 