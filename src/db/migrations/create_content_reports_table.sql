-- コンテンツ報告テーブルの作成
-- 既存のテーブルが存在する場合は削除して新規作成（開発環境用）
DROP TABLE IF EXISTS content_reports;

CREATE TABLE content_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID NOT NULL,
  reporter_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  
  -- ユニーク制約（同じユーザーが同じプロンプトを複数回報告できないようにする）
  CONSTRAINT unique_prompt_report UNIQUE (prompt_id, reporter_id)
);

-- インデックス
CREATE INDEX idx_content_reports_prompt_id ON content_reports(prompt_id);
CREATE INDEX idx_content_reports_status ON content_reports(status);
CREATE INDEX idx_content_reports_created_at ON content_reports(created_at DESC);

-- RLS (Row Level Security) ポリシーの設定
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

-- 報告データの挿入は認証ユーザーのみ可能
CREATE POLICY "認証ユーザーのみ報告可能" ON content_reports
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- プロンプト作者は自分のプロンプトの報告データを参照可能
CREATE POLICY "プロンプト作者は報告データを参照可能" ON content_reports
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM prompts
      WHERE id = content_reports.prompt_id AND author_id = auth.uid()
    )
  );

-- 管理者は全ての報告データを参照可能
CREATE POLICY "管理者は全報告データを参照可能" ON content_reports
  FOR ALL TO authenticated
  USING (auth.role() = 'service_role' OR auth.role() = 'supabase_admin');

-- promptsテーブルにneeds_reviewフラグを追加（もし存在しない場合）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prompts' AND column_name = 'needs_review'
  ) THEN
    ALTER TABLE prompts ADD COLUMN needs_review BOOLEAN DEFAULT FALSE;
  END IF;
END $$; 