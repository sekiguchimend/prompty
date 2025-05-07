// @ts-ignore Denoの標準ライブラリを使用するためIgnore
import { serve } from 'https://deno.land/std/http/server.ts'
// @ts-ignore Supabaseライブラリを使用するためIgnore
// import { createClient } from '@supabase/supabase-js'
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

// @ts-ignore Stripeライブラリを使用するためIgnore
// import Stripe from 'stripe'
import Stripe from "https://esm.sh/stripe@14.19.0";

// DenoとNode.jsの環境の違いによるエラー回避のため型宣言
declare global {
  interface Window {
    Deno: {
      env: {
        get(key: string): string | undefined;
      };
    };
  }
}

// Denoの環境変数アクセスのためのヘルパー関数
const getEnv = (key: string): string => {
  // @ts-ignore Denoの環境変数アクセスのためのignore
  return Deno.env.get(key) || '';
}

// StripeクライアントとSupabaseクライアントの初期化
// @ts-ignore Stripeのバージョン不一致エラーを回避
const stripe = new Stripe(getEnv('STRIPE_SECRET_KEY'), { apiVersion: '2024-06-20' });
const supabase = createClient(
  getEnv('SUPABASE_URL'),
  getEnv('SUPABASE_SERVICE_ROLE_KEY')
);

// リクエストの型定義
interface PromptRequest {
  record: {
    id: string;
  };
}

// レスポンスハンドラー
serve(async (req: Request) => {
  const { record } = await req.json() as PromptRequest;
  const { data: prompt } = await supabase
    .from('prompts')
    .select('id, title, is_free, price, currency:currency, author_id')
    .eq('id', record.id)
    .single();

  if (!prompt || prompt.is_free || !prompt.price) {
    return new Response('free', { status: 200 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_account_id')
    .eq('id', prompt.author_id)
    .single();

  if (!profile?.stripe_account_id) {
    await supabase.from('prompts')
      .update({ stripe_error: 'NO_STRIPE_ACCOUNT' })
      .eq('id', prompt.id);
    return new Response('no account', { status: 422 });
  }

  try {
    /* ★ ここが核心：Product と Price を 1 API でまとめて生成 ★ */
    const product = await stripe.products.create(
      {
        name: prompt.title,
        metadata: { prompt_id: prompt.id },
        default_price_data: {
          unit_amount: prompt.price,
          currency: prompt.currency ?? 'jpy',
        },
      },
      { stripeAccount: profile.stripe_account_id },
    );

    // Product の default_price がそのまま Price ID
    const priceId =
      typeof product.default_price === 'string'
        ? product.default_price
        // @ts-ignore Stripe.Price型のIDプロパティにアクセス
        : (product.default_price).id;

    // 記事行の更新まで **同じ関数内で完結**（記事保存"までまとめて実行"）
    await supabase.from('prompts')
      .update({
        stripe_product_id: product.id,
        stripe_price_id:  priceId,
        stripe_error:     null,
      })
      .eq('id', prompt.id);

  } catch (e) {
    await supabase.from('prompts')
      .update({ stripe_error: (e as Error).message })
      .eq('id', prompt.id);
  }

  return new Response('ok', { status: 200 });
}); 