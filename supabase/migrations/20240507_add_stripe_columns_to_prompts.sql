-- スキーマ拡張：Stripe 連携カラム
ALTER TABLE public.prompts
  ADD COLUMN IF NOT EXISTS stripe_product_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_price_id   TEXT,
  ADD COLUMN IF NOT EXISTS stripe_error      TEXT;

-- RLS ポリシー：有料投稿は Stripe アカウント必須
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY prompts_insert_policy
  ON public.prompts
  FOR INSERT
  USING (
    (
      NEW.is_free = TRUE
      OR NEW.price IS NULL
      OR NEW.price = 0
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.stripe_account_id IS NOT NULL
    )
  ); 