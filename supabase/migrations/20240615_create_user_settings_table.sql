-- user_settingsテーブルの作成
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  account_settings JSONB DEFAULT NULL,
  notification_settings JSONB DEFAULT NULL,
  reaction_settings JSONB DEFAULT NULL,
  comment_settings JSONB DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- user_idに一意制約を追加（一人のユーザーにつき一行のレコードのみ許可）
  CONSTRAINT user_settings_user_id_key UNIQUE (user_id)
);

-- 行レベルのセキュリティポリシーを設定
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の設定のみ参照可能
CREATE POLICY "ユーザーは自分の設定のみ参照可能" ON public.user_settings
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ユーザーは自分の設定のみ作成可能
CREATE POLICY "ユーザーは自分の設定のみ作成可能" ON public.user_settings
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ユーザーは自分の設定のみ更新可能
CREATE POLICY "ユーザーは自分の設定のみ更新可能" ON public.user_settings
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ユーザーは自分の設定のみ削除可能
CREATE POLICY "ユーザーは自分の設定のみ削除可能" ON public.user_settings
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- インデックスの作成
CREATE INDEX IF NOT EXISTS user_settings_user_id_idx ON public.user_settings (user_id);

-- updated_at を自動更新する関数とトリガー
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_settings_updated_at
BEFORE UPDATE ON public.user_settings
FOR EACH ROW EXECUTE FUNCTION update_user_settings_updated_at(); 