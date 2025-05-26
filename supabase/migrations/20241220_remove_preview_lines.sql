-- 有料記事の無料プレビューライン数カラムを削除
-- マーカーベースの制御に変更するため、行数設定は不要

-- インデックスを削除
DROP INDEX IF EXISTS idx_prompts_preview_lines;

-- カラムを削除
ALTER TABLE public.prompts 
DROP COLUMN IF EXISTS preview_lines; 