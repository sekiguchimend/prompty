-- followsテーブルの外部キー制約を修正
-- auth.usersからprofilesテーブルへの参照に変更

-- 既存の外部キー制約を削除
ALTER TABLE public.follows DROP CONSTRAINT IF EXISTS follows_follower_id_fkey;
ALTER TABLE public.follows DROP CONSTRAINT IF EXISTS follows_following_id_fkey;

-- 新しい外部キー制約を追加（profilesテーブルを参照）
ALTER TABLE public.follows 
ADD CONSTRAINT follows_follower_id_fkey 
FOREIGN KEY (follower_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.follows 
ADD CONSTRAINT follows_following_id_fkey 
FOREIGN KEY (following_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- インデックスが存在することを確認
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);

-- 一意制約を追加（既存の制約がない場合のみ）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_follow_pair'
    ) THEN
        ALTER TABLE public.follows 
        ADD CONSTRAINT unique_follow_pair 
        UNIQUE (follower_id, following_id);
    END IF;
END $$; 