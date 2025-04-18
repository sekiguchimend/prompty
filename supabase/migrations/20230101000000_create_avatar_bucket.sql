-- avatarsバケットがなければ作成
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- avatarsバケットのRLSを有効化（まだ有効でない場合）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'storage' AND tablename = 'objects'
  ) THEN
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- 既存のポリシーを削除してから再作成
DROP POLICY IF EXISTS "avatars:アップロード" ON storage.objects;
DROP POLICY IF EXISTS "avatars:更新" ON storage.objects;
DROP POLICY IF EXISTS "avatars:削除" ON storage.objects;
DROP POLICY IF EXISTS "avatars:閲覧" ON storage.objects;

-- アバター画像をアップロードするためのポリシー（認証済みユーザーのみ）
CREATE POLICY "avatars:アップロード" ON storage.objects
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND
  bucket_id = 'avatars' AND
  (auth.uid()::text = SPLIT_PART(name, '-', 2))
);

-- アバター画像を更新するためのポリシー
CREATE POLICY "avatars:更新" ON storage.objects
FOR UPDATE USING (
  auth.role() = 'authenticated' AND
  bucket_id = 'avatars' AND
  (auth.uid()::text = SPLIT_PART(name, '-', 2))
);

-- アバター画像を削除するためのポリシー
CREATE POLICY "avatars:削除" ON storage.objects
FOR DELETE USING (
  auth.role() = 'authenticated' AND
  bucket_id = 'avatars' AND
  (auth.uid()::text = SPLIT_PART(name, '-', 2))
);

-- アバター画像を誰でも閲覧可能にするポリシー
CREATE POLICY "avatars:閲覧" ON storage.objects
FOR SELECT USING (
  bucket_id = 'avatars'
);

-- 古いアバター画像を削除するための関数とトリガー
CREATE OR REPLACE FUNCTION delete_old_avatar()
RETURNS TRIGGER AS $$
DECLARE
  old_file_name TEXT;
BEGIN
  -- avatar_urlが変更され、古いURLがある場合
  IF OLD.avatar_url IS DISTINCT FROM NEW.avatar_url AND OLD.avatar_url IS NOT NULL THEN
    -- URLからファイル名を抽出
    old_file_name := SPLIT_PART(OLD.avatar_url, '/', -1);
    
    -- ファイル名が適切な形式かチェック
    IF old_file_name LIKE 'avatar-%' THEN
      -- 削除処理（権限の問題で失敗する可能性があるため、例外をキャッチ）
      BEGIN
        DELETE FROM storage.objects
        WHERE bucket_id = 'avatars' AND name = old_file_name;
      EXCEPTION WHEN OTHERS THEN
        -- エラーを無視（ログに記録することも可能）
        NULL;
      END;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- プロフィール更新時に古いアバター画像を削除するトリガー
DROP TRIGGER IF EXISTS delete_old_avatar_trigger ON public.profiles;
CREATE TRIGGER delete_old_avatar_trigger
AFTER UPDATE ON public.profiles
FOR EACH ROW
WHEN (OLD.avatar_url IS DISTINCT FROM NEW.avatar_url)
EXECUTE FUNCTION delete_old_avatar(); 