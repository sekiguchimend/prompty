-- Supabaseストレージの現在の設定を確認するクエリ

-- 1. バケットの確認
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets 
WHERE id = 'prompt-thumbnails';

-- 2. ストレージオブジェクトのポリシー確認
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;

-- 3. RLSの有効状態確認
SELECT schemaname, tablename, rowsecurity
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- 4. 現在の認証状態確認（テスト用）
SELECT auth.uid() as current_user_id, auth.jwt() as current_jwt;