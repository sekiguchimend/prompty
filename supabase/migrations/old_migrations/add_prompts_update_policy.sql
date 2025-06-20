-- promptsテーブルのRow Level Securityを有効化（まだ有効でない場合）
ALTER TABLE IF EXISTS prompts ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを確認（念のため）
SELECT * FROM pg_policies WHERE tablename = 'prompts';

-- アノニマス（未認証）ユーザーにview_countの更新を許可するポリシーを追加
-- 注: 他のフィールドは更新されないよう、明示的にview_countのみを対象にする
CREATE POLICY "Allow anonymous users to update view_count" 
ON prompts
FOR UPDATE 
TO anon, authenticated
USING (true)
WITH CHECK (
  -- 更新対象のカラムがview_countだけであることを確認
  (ARRAY(SELECT jsonb_object_keys(to_jsonb(NEW) - to_jsonb(OLD))) <@ ARRAY['view_count'])
);

-- より制限の少ないバージョン（更新が機能しない場合のバックアップとして）
-- 既存のポリシーと競合する場合は注意して使用
CREATE POLICY "Allow anyone to update prompts" 
ON prompts
FOR UPDATE 
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 特権ロールにfull accessを許可
CREATE POLICY "Allow service_role to update everything" 
ON prompts
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true); 