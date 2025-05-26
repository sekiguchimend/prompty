-- 有料記事の無料プレビューライン数を設定するカラムを追加
ALTER TABLE public.prompts 
ADD COLUMN preview_lines INTEGER DEFAULT 3;

-- カラムにコメントを追加
COMMENT ON COLUMN public.prompts.preview_lines IS '有料記事で無料で表示するライン数（デフォルト: 3行）';

-- インデックスを追加（パフォーマンス向上のため）
CREATE INDEX IF NOT EXISTS idx_prompts_preview_lines ON public.prompts(preview_lines); 