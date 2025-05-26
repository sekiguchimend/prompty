-- 既存のfree_preview_linesカラムをpreview_linesにリネーム
ALTER TABLE public.prompts 
RENAME COLUMN free_preview_lines TO preview_lines;

-- 既存のインデックスを削除して新しいインデックスを作成
DROP INDEX IF EXISTS idx_prompts_free_preview_lines;
CREATE INDEX IF NOT EXISTS idx_prompts_preview_lines ON public.prompts(preview_lines); 