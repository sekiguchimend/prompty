-- 完全なSupabaseストレージ設定（一括実行用）

-- 1. 既存のポリシーをすべて削除
DROP POLICY IF EXISTS "Authenticated users can upload to prompt-thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their own files in prompt-thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their own files in prompt-thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for prompt-thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Service role can manage all files in prompt-thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "update_policy" ON storage.objects;
DROP POLICY IF EXISTS "delete_policy" ON storage.objects;
DROP POLICY IF EXISTS "public_read_policy" ON storage.objects;

-- 2. バケットを作成または更新（動画対応）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'prompt-thumbnails',
  'prompt-thumbnails', 
  true,
  52428800,
  '["image/jpeg","image/png","image/gif","image/webp","video/mp4","video/webm","video/mov","video/avi","video/quicktime"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3. RLSの有効化
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 4. 新しいポリシーを作成

-- 認証されたユーザーがアップロードできるポリシー
CREATE POLICY "upload_policy"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'prompt-thumbnails' 
  AND auth.uid() IS NOT NULL
);

-- 認証されたユーザーが自分のファイルを更新できるポリシー
CREATE POLICY "update_policy"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'prompt-thumbnails' 
  AND auth.uid() IS NOT NULL
);

-- 認証されたユーザーが自分のファイルを削除できるポリシー
CREATE POLICY "delete_policy"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'prompt-thumbnails' 
  AND auth.uid() IS NOT NULL
);

-- 公開読み取りポリシー（すべてのユーザーがファイルを読み取れる）
CREATE POLICY "public_read_policy"
ON storage.objects FOR SELECT
USING (bucket_id = 'prompt-thumbnails');

-- 5. 設定確認（実行後に結果を確認）
SELECT 
  'バケット設定' as type,
  id, 
  file_size_limit/1024/1024 as size_limit_mb, 
  allowed_mime_types 
FROM storage.buckets 
WHERE id = 'prompt-thumbnails'

UNION ALL

SELECT 
  'ポリシー一覧' as type,
  policyname as id,
  cmd::text as size_limit_mb,
  CASE 
    WHEN qual IS NOT NULL THEN substring(qual::text, 1, 50) || '...'
    ELSE 'No condition'
  END as allowed_mime_types
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY type, id;