-- プロンプトで使用されるAIモデル情報を保存するためのカラムを追加

-- カラムを追加
ALTER TABLE public.prompts 
ADD COLUMN IF NOT EXISTS ai_model VARCHAR(100) DEFAULT NULL;

-- インデックスを追加（AIモデル別検索のパフォーマンス向上のため）
CREATE INDEX IF NOT EXISTS idx_prompts_ai_model ON public.prompts(ai_model);

-- AIモデルとパブリック状態の複合インデックス（よく使われる組み合わせ）
CREATE INDEX IF NOT EXISTS idx_prompts_ai_model_public ON public.prompts(ai_model, is_public);

-- コメントを追加
COMMENT ON COLUMN public.prompts.ai_model IS '使用されたAIモデル (claude-3-5-sonnet-20241022, gpt-4o など)';