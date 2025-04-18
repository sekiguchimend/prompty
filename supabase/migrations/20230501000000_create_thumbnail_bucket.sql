-- prompt-thumbnailsバケットがなければ作成
INSERT INTO storage.buckets (id, name, public)
VALUES ('prompt-thumbnails', 'prompt-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- RLSが有効化されているか確認し、されていなければ有効化
DO $$ 
BEGIN
  -- objects テーブルが存在するか確認
  IF EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'storage' AND tablename = 'objects'
  ) THEN
    -- RLSが無効の場合のみ有効化
    IF NOT EXISTS (
      SELECT FROM pg_tables 
      WHERE schemaname = 'storage' AND tablename = 'objects' AND rowsecurity
    ) THEN
      ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    END IF;
  END IF;
END $$;

-- 既存のポリシーを削除してから再作成
DROP POLICY IF EXISTS "thumbnails:アップロード" ON storage.objects;
DROP POLICY IF EXISTS "thumbnails:更新" ON storage.objects;
DROP POLICY IF EXISTS "thumbnails:削除" ON storage.objects;
DROP POLICY IF EXISTS "thumbnails:閲覧" ON storage.objects;

-- サムネイル画像のアップロードポリシー（認証済みユーザーのみ）
CREATE POLICY "thumbnails:アップロード" ON storage.objects
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND
  bucket_id = 'prompt-thumbnails'
);

-- サムネイル画像の更新ポリシー
CREATE POLICY "thumbnails:更新" ON storage.objects
FOR UPDATE USING (
  auth.role() = 'authenticated' AND
  bucket_id = 'prompt-thumbnails' AND
  (EXISTS (
    SELECT 1 FROM prompts
    WHERE prompts.author_id = auth.uid() AND
    prompts.thumbnail_url LIKE '%' || name || '%'
  ))
);

-- サムネイル画像の削除ポリシー
CREATE POLICY "thumbnails:削除" ON storage.objects
FOR DELETE USING (
  auth.role() = 'authenticated' AND
  bucket_id = 'prompt-thumbnails' AND
  (EXISTS (
    SELECT 1 FROM prompts
    WHERE prompts.author_id = auth.uid() AND
    prompts.thumbnail_url LIKE '%' || name || '%'
  ))
);

-- サムネイル画像の閲覧ポリシー（公開）
CREATE POLICY "thumbnails:閲覧" ON storage.objects
FOR SELECT USING (
  bucket_id = 'prompt-thumbnails'
); 