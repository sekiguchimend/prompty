-- フォローテーブルが存在しない場合に作成するためのファンクション
CREATE OR REPLACE FUNCTION public.create_follows_table_if_not_exists()
RETURNS void AS $$
BEGIN
  -- follows テーブルが存在するかチェック
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'follows') THEN
    -- フォローテーブルを作成
    CREATE TABLE public.follows (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      
      -- 一意制約を追加（同じフォロー関係は1つだけ）
      CONSTRAINT unique_follower_following UNIQUE (follower_id, following_id)
    );
    
    -- インデックスを追加（パフォーマンス向上）
    CREATE INDEX idx_follows_follower_id ON public.follows(follower_id);
    CREATE INDEX idx_follows_following_id ON public.follows(following_id);
    
    -- RLSポリシーを設定
    ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
    
    -- すべてのユーザーに読み取り権限を付与
    CREATE POLICY "フォロー関係をすべてのユーザーが閲覧可能" 
      ON public.follows FOR SELECT
      USING (true);
      
    -- フォロー登録は認証済みユーザーのみ可能
    CREATE POLICY "認証済みユーザーのみフォローできる"
      ON public.follows FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = follower_id);
      
    -- 自分がフォローしたものだけ削除可能
    CREATE POLICY "自分のフォローのみ削除可能"
      ON public.follows FOR DELETE
      USING (auth.uid() = follower_id);
    
    -- コメント追加
    COMMENT ON TABLE public.follows IS 'ユーザー間のフォロー関係を格納するテーブル';
    COMMENT ON COLUMN public.follows.follower_id IS 'フォローするユーザーのID';
    COMMENT ON COLUMN public.follows.following_id IS 'フォローされるユーザーのID';
    
    RAISE NOTICE 'follows テーブルを作成しました';
  ELSE
    RAISE NOTICE 'follows テーブルは既に存在します';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 