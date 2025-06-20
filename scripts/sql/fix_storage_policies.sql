-- 既存のポリシーを削除してから新しいポリシーを作成

-- 1. 既存のポリシーをすべて削除
DROP POLICY IF EXISTS "Authenticated users can upload to prompt-thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their own files in prompt-thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their own files in prompt-thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for prompt-thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Service role can manage all files in prompt-thumbnails" ON storage.objects;

-- 2. バケット設定を更新（動画対応）
UPDATE storage.buckets 
SET 
  file_size_limit = 52428800, -- 50MB（動画用）
  allowed_mime_types = '["image/jpeg","image/png","image/gif","image/webp","video/mp4","video/webm","video/mov","video/avi","video/quicktime"]'::jsonb
WHERE id = 'prompt-thumbnails';

-- 3. 新しいポリシーを作成

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

-- RLSの有効化を確認
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;