-- 既存のポリシーを削除
DROP POLICY IF EXISTS "フォロー関係をすべてのユーザーが閲覧可能" ON public.follows;
DROP POLICY IF EXISTS "認証済みユーザーのみフォローできる" ON public.follows;
DROP POLICY IF EXISTS "自分のフォローのみ削除可能" ON public.follows;

-- RLSを有効化（既に有効でも問題ない）
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- より安全なポリシーを再作成

-- すべてのユーザーに読み取り権限を付与（引き続き全体公開）
CREATE POLICY "follows_select_policy"
  ON public.follows
  FOR SELECT
  TO public
  USING (true);

-- 認証済みユーザーのみがフォローを追加可能 - 自分のユーザーIDのみ挿入可能
CREATE POLICY "follows_insert_policy"
  ON public.follows
  FOR INSERT
  TO authenticated
  WITH CHECK (follower_id::text = auth.uid()::text);

-- 自分がフォローした関係のみ削除可能
CREATE POLICY "follows_delete_policy"
  ON public.follows
  FOR DELETE
  TO authenticated
  USING (follower_id::text = auth.uid()::text);

-- フォローテーブルが空の場合の初期データ（テスト用）
-- FUNCTION gen_random_uuid()で生成したUUIDを使用
INSERT INTO public.follows (follower_id, following_id, created_at)
SELECT 
  auth.uid() as follower_id,
  '00000000-0000-0000-0000-000000000000'::uuid as following_id,
  NOW() as created_at
WHERE 
  NOT EXISTS (SELECT 1 FROM public.follows WHERE follows.following_id = '00000000-0000-0000-0000-000000000000'::uuid)
  AND auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING; 