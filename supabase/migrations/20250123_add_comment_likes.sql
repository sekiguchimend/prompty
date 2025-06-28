-- コメントいいね機能のためのテーブルを追加
CREATE TABLE public.comment_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  comment_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT comment_likes_pkey PRIMARY KEY (id),
  CONSTRAINT comment_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT comment_likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.comments(id) ON DELETE CASCADE,
  CONSTRAINT comment_likes_unique UNIQUE (user_id, comment_id)
);

-- RLS (Row Level Security) ポリシーを設定
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- Select ポリシー: 誰でも閲覧可能
CREATE POLICY "comment_likes_select_policy" ON public.comment_likes
  FOR SELECT
  USING (true);

-- Insert ポリシー: 認証済みユーザーのみ
CREATE POLICY "comment_likes_insert_policy" ON public.comment_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Delete ポリシー: 自分の「いいね」のみ削除可能
CREATE POLICY "comment_likes_delete_policy" ON public.comment_likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- インデックス作成
CREATE INDEX idx_comment_likes_comment_id ON public.comment_likes(comment_id);
CREATE INDEX idx_comment_likes_user_id ON public.comment_likes(user_id); 