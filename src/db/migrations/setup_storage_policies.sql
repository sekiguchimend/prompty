-- Supabaseストレージのバケットとポリシーを設定するマイグレーション

-- 1. prompt-thumbnailsバケットが存在しない場合は作成
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'prompt-thumbnails',
  'prompt-thumbnails', 
  true,
  10485760, -- 10MB
  '{"image/jpeg","image/png","image/gif","image/webp","video/mp4","video/webm","video/mov","video/avi"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. 認証されたユーザーがprompt-thumbnailsバケットにアップロードできるポリシー
DROP POLICY IF EXISTS "Authenticated users can upload to prompt-thumbnails" ON storage.objects;
CREATE POLICY "Authenticated users can upload to prompt-thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'prompt-thumbnails' 
  AND auth.uid() IS NOT NULL
);

-- 3. 認証されたユーザーが自分のファイルを更新できるポリシー
DROP POLICY IF EXISTS "Authenticated users can update their own files in prompt-thumbnails" ON storage.objects;
CREATE POLICY "Authenticated users can update their own files in prompt-thumbnails"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'prompt-thumbnails' 
  AND auth.uid() IS NOT NULL
);

-- 4. 認証されたユーザーが自分のファイルを削除できるポリシー
DROP POLICY IF EXISTS "Authenticated users can delete their own files in prompt-thumbnails" ON storage.objects;
CREATE POLICY "Authenticated users can delete their own files in prompt-thumbnails"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'prompt-thumbnails' 
  AND auth.uid() IS NOT NULL
);

-- 5. 公開読み取りポリシー（すべてのユーザーがファイルを読み取れる）
DROP POLICY IF EXISTS "Public read access for prompt-thumbnails" ON storage.objects;
CREATE POLICY "Public read access for prompt-thumbnails"
ON storage.objects FOR SELECT
USING (bucket_id = 'prompt-thumbnails');

-- 6. 管理者が全てのファイルにアクセスできるポリシー（サービスロールキー使用時）
DROP POLICY IF EXISTS "Service role can manage all files in prompt-thumbnails" ON storage.objects;
CREATE POLICY "Service role can manage all files in prompt-thumbnails"
ON storage.objects
USING (
  bucket_id = 'prompt-thumbnails'
  AND (
    auth.uid() IS NOT NULL 
    OR auth.jwt() ->> 'role' = 'service_role'
  )
);

-- 7. RLSの有効化を確認
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ストレージ設定の確認用クエリ（参考）
-- SELECT * FROM storage.buckets WHERE id = 'prompt-thumbnails';
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename = 'objects' AND schemaname = 'storage';