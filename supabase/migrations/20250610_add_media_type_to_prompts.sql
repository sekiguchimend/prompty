-- プロンプトのメディアタイプを識別するためのカラムを追加
-- 'text', 'image', 'video', 'code', 'mixed' などの値を保存

-- カラムを追加
ALTER TABLE public.prompts 
ADD COLUMN IF NOT EXISTS media_type VARCHAR(20) DEFAULT 'text' NOT NULL;

-- インデックスを追加（検索とフィルタリングのパフォーマンス向上のため）
CREATE INDEX IF NOT EXISTS idx_prompts_media_type ON public.prompts(media_type);

-- メディアタイプとパブリック状態の複合インデックス（よく使われる組み合わせ）
CREATE INDEX IF NOT EXISTS idx_prompts_media_type_public ON public.prompts(media_type, is_public);

-- コメントを追加
COMMENT ON COLUMN public.prompts.media_type IS 'プロンプトのメディアタイプ (text, image, video, code, mixed)';

-- 既存データに対してデフォルト値を設定
UPDATE public.prompts 
SET media_type = 'text' 
WHERE media_type IS NULL;