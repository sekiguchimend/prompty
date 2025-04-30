-- reportsテーブルの作成
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  target_id UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('comment', 'prompt')),
  prompt_id UUID NOT NULL,
  reporter_id UUID NOT NULL REFERENCES auth.users(id),
  reason TEXT NOT NULL CHECK (reason IN ('inappropriate', 'spam', 'harassment', 'misinformation', 'other')),
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 同じユーザーが同じ対象に対して複数回報告できないようにする
  CONSTRAINT unique_user_target UNIQUE (reporter_id, target_id, target_type)
);

-- 行レベルのセキュリティポリシーを設定
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- レポートの作成は認証済みユーザーなら誰でも可能
CREATE POLICY "認証済みユーザーが報告を作成できる" ON public.reports
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- レポートの閲覧はレポートを作成したユーザーか管理者のみ
CREATE POLICY "レポート作成者が自分のレポートを閲覧できる" ON public.reports
  FOR SELECT TO authenticated
  USING (reporter_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

-- 更新・削除は管理者のみ
CREATE POLICY "管理者のみレポートを更新できる" ON public.reports
  FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "管理者のみレポートを削除できる" ON public.reports
  FOR DELETE TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- 検索用インデックスを作成
CREATE INDEX IF NOT EXISTS reports_target_id_idx ON public.reports (target_id);
CREATE INDEX IF NOT EXISTS reports_target_type_idx ON public.reports (target_type);
CREATE INDEX IF NOT EXISTS reports_prompt_id_idx ON public.reports (prompt_id);
CREATE INDEX IF NOT EXISTS reports_reporter_id_idx ON public.reports (reporter_id);
CREATE INDEX IF NOT EXISTS reports_status_idx ON public.reports (status);

-- updated_at を自動更新する関数
CREATE OR REPLACE FUNCTION update_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- reports テーブルの更新時に updated_at を自動更新するトリガー
CREATE TRIGGER set_reports_updated_at
BEFORE UPDATE ON public.reports
FOR EACH ROW EXECUTE FUNCTION update_reports_updated_at(); 