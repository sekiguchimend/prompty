-- 1. price型を整数に統一
ALTER TABLE public.prompts ALTER COLUMN price TYPE integer USING (price * 100)::integer;
COMMENT ON COLUMN public.prompts.price IS '最小通貨単位（JPY=1円）で保存';

-- 4. 未連携アカウントのエラー格納方法の改善
ALTER TABLE public.prompts 
  ADD COLUMN stripe_error_code VARCHAR(50),
  ADD COLUMN stripe_error_msg TEXT;

-- 既存のstripe_errorの内容をstripe_error_msgに移行
UPDATE public.prompts 
SET stripe_error_msg = stripe_error
WHERE stripe_error IS NOT NULL;

-- 既存のNO_STRIPE_ACCOUNTエラーを分類
UPDATE public.prompts 
SET stripe_error_code = 'NO_ACCOUNT'
WHERE stripe_error = 'NO_STRIPE_ACCOUNT';

-- 6. RLS強化 - 有料記事の後から更新を制限
CREATE POLICY "prompts_update_policy" ON "public"."prompts" 
FOR UPDATE USING (
  auth.uid() = author_id AND (
    (OLD.is_free = NEW.is_free) OR 
    (OLD.is_free = false AND NEW.is_free = true) -- 有料→無料はOK
  )
);

-- 7. purchases冪等化 - paymentsテーブルの重複支払い防止
ALTER TABLE public.payments ADD CONSTRAINT unique_payment_intent_id UNIQUE (payment_intent_id);

-- 8. VIEWに購入フラグ追加
CREATE OR REPLACE VIEW public.v_prompts_secure AS
SELECT 
  p.*,
  EXISTS (
    SELECT 1 FROM public.payments 
    WHERE prompt_id = p.id 
    AND user_id = auth.uid() 
    AND status = 'paid'
  ) AS is_purchased
FROM 
  public.prompts p
WHERE 
  p.published = true OR p.author_id = auth.uid();

-- 9. 投稿→同期の確実化 - トリガー作成
CREATE OR REPLACE FUNCTION public.handle_prompt_insert_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- 有料記事の場合だけEdge Functionを呼び出す
  IF (NEW.is_free = false AND (NEW.price IS NOT NULL AND NEW.price > 0)) THEN
    PERFORM
      http_post(
        format('%s/handle_prompts_insert', current_setting('app.supabase_functions_url', true)),
        json_build_object('record', json_build_object('id', NEW.id)),
        'application/json',
        json_build_object('Authorization', concat('Bearer ', current_setting('app.supabase_service_role_key', true)))
      );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER prompt_after_insert_trigger
AFTER INSERT ON public.prompts
FOR EACH ROW
EXECUTE FUNCTION public.handle_prompt_insert_trigger();

-- 設定パラメータの配置 (トリガー内で使用)
ALTER DATABASE postgres SET "app.supabase_functions_url" TO 'supabase_functions_url_placeholder';
ALTER DATABASE postgres SET "app.supabase_service_role_key" TO 'supabase_service_role_key_placeholder'; 