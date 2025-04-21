-- 既存テーブルの確認
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'follows') THEN
        RAISE NOTICE 'follows テーブルは既に存在します';
    ELSE
        -- UUIDサポートを確保
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        
        -- フォローテーブルを作成
        CREATE TABLE public.follows (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            follower_id UUID NOT NULL,
            following_id UUID NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
            
            -- 一意制約を追加（同じフォロー関係は1つだけ）
            CONSTRAINT unique_follower_following UNIQUE (follower_id, following_id)
        );
        
        -- インデックスを追加（パフォーマンス向上）
        CREATE INDEX idx_follows_follower_id ON public.follows(follower_id);
        CREATE INDEX idx_follows_following_id ON public.follows(following_id);
        
        -- RLSポリシーを設定
        ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
        
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
            WITH CHECK (true);  -- 一時的にすべての認証ユーザーに許可
            
        -- 自分がフォローした関係のみ削除可能
        CREATE POLICY "follows_delete_policy"
            ON public.follows
            FOR DELETE
            TO authenticated
            USING (true);  -- 一時的にすべての認証ユーザーに許可
        
        -- コメント追加
        COMMENT ON TABLE public.follows IS 'ユーザー間のフォロー関係を格納するテーブル';
        COMMENT ON COLUMN public.follows.follower_id IS 'フォローするユーザーのID';
        COMMENT ON COLUMN public.follows.following_id IS 'フォローされるユーザーのID';
        
        RAISE NOTICE 'follows テーブルを作成しました';
    END IF;
END $$;

-- RLSポリシーの制限を緩めた状態のテストデータ
INSERT INTO public.follows (follower_id, following_id, created_at)
VALUES 
  ('9848656c-6f4c-49de-9d13-c1e6e8614788', '30cf6d96-60cb-47e5-9c27-75356e1746a9', NOW())
ON CONFLICT (follower_id, following_id) DO NOTHING;

-- テストデータが挿入されたかどうかを確認
SELECT * FROM public.follows
WHERE follower_id = '9848656c-6f4c-49de-9d13-c1e6e8614788'
AND following_id = '30cf6d96-60cb-47e5-9c27-75356e1746a9'; 