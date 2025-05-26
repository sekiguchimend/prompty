-- 有料記事の無料プレビュー行数カラムを追加
-- ドラッグ可能な赤線の位置を行数として保存

-- カラムを追加
ALTER TABLE public.prompts 
ADD COLUMN IF NOT EXISTS preview_lines INTEGER DEFAULT NULL;

-- インデックスを追加
CREATE INDEX IF NOT EXISTS idx_prompts_preview_lines ON public.prompts(preview_lines);

-- コメントを追加
COMMENT ON COLUMN public.prompts.preview_lines IS '有料記事の無料プレビュー行数（赤線の位置）'; 