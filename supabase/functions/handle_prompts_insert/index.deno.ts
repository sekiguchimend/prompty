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
  record?: {
    id: string;
  };
  id?: string; // IDを直接渡す場合
}

// レスポンスハンドラー
serve(async (req: Request) => {
  try {
    // デバッグ用にリクエストボディを出力
    console.log('リクエスト受信:', await req.clone().text());
    
    const requestData = await req.json() as PromptRequest;
    // 2. Edge Function 引数の取り扱い改善
    const promptId = requestData.id ?? requestData.record?.id;
    
    if (!promptId) {
      console.error('エラー: プロンプトIDが指定されていません');
      return new Response(JSON.stringify({ error: 'プロンプトIDが必要です' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('処理開始 - 記事ID:', promptId);
    
    const { data: prompt, error } = await supabase
      .from('prompts')
      .select('id, title, is_free, price, currency:currency, author_id')
      .eq('id', promptId)
      .single();
    
    // エラーハンドリングを追加
    if (error) {
      console.error('データ取得エラー:', error.message);
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 取得したデータをログ出力
    console.log('取得したプロンプトデータ:', JSON.stringify(prompt));
    
    // price は整数型として扱う
    // 文字列の場合は整数に変換、数値の場合はそのまま使用
    const priceValue = typeof prompt.price === 'string' 
      ? parseInt(prompt.price, 10) 
      : (prompt.price || 0);
      
    console.log('価格情報:', {
      元のprice: prompt.price,
      変換後price: priceValue,
      型: typeof prompt.price,
      is_free: prompt.is_free
    });
    
    // 条件判定を明確にする（nullチェック、0チェック、is_freeチェック）
    if (!prompt || prompt.is_free === true || !priceValue || priceValue <= 0) {
      console.log('無料記事として処理:', {
        reason: !prompt ? 'プロンプトなし' : 
                prompt.is_free === true ? 'is_freeがtrue' : 
                !priceValue ? 'price値なし' : 'price値が0以下'
      });
      return new Response('free', { status: 200 });
    }

    console.log('有料記事として処理を続行します:', {
      id: prompt.id,
      price: priceValue,
      is_free: prompt.is_free
    });

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', prompt.author_id)
      .single();

    if (!profile?.stripe_account_id) {
      console.log('Stripeアカウントなし - 著者ID:', prompt.author_id);
      // 4. 未連携アカウントのエラー格納方法の改善
      await supabase.from('prompts')
        .update({ 
          stripe_error_code: 'NO_ACCOUNT',
          stripe_error_msg: 'Stripeアカウントが連携されていません'
        })
        .eq('id', prompt.id);
      return new Response('no account', { status: 422 });
    }

    try {
      /* ★ ここが核心：Product と Price を 1 API でまとめて生成 ★ */
      console.log('Stripe処理開始 - アカウントID:', profile.stripe_account_id);
      
      // 通貨を'jpy'に固定
      const currency = 'jpy';
      console.log('通貨を固定:', currency);
      
      // 3. Stripe 重複防止のためのidempotencyKey設定
      const product = await stripe.products.create(
        {
          name: prompt.title,
          metadata: { prompt_id: prompt.id },
          default_price_data: {
            unit_amount: priceValue,
            currency: currency,
          },
        },
        { 
          stripeAccount: profile.stripe_account_id,
          idempotencyKey: prompt.id // プロンプトIDを重複防止キーとして使用
        },
      );

      console.log('Stripe製品作成成功:', product.id);

      // Product の default_price がそのまま Price ID
      const priceId =
        typeof product.default_price === 'string'
          ? product.default_price
          // @ts-ignore Stripe.Price型のIDプロパティにアクセス
          : (product.default_price).id;
      
      console.log('価格ID:', priceId);

      // 記事行の更新まで **同じ関数内で完結**（記事保存"までまとめて実行"）
      const { error: updateError } = await supabase.from('prompts')
        .update({
          stripe_product_id: product.id,
          stripe_price_id:  priceId,
          stripe_error_code: null,
          stripe_error_msg: null
        })
        .eq('id', prompt.id);
      
      if (updateError) {
        console.error('DB更新エラー:', updateError.message);
        throw new Error(`DB更新エラー: ${updateError.message}`);
      }
      
      console.log('処理完了 - 記事ID:', prompt.id);

    } catch (e) {
      // 5. 例外ログの追加
      console.error('Stripeエラー:', e);
      const errorMessage = (e as Error).message;
      const errorCode = errorMessage.includes('account') ? 'ACCOUNT_ERROR' :
                       errorMessage.includes('authentication') ? 'AUTH_ERROR' :
                       'API_ERROR';
      
      await supabase.from('prompts')
        .update({
          stripe_error_code: errorCode,
          stripe_error_msg: errorMessage
        })
        .eq('id', prompt.id);
        
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (e) {
    // 全体的なエラーハンドリング改善
    console.error('予期せぬエラー:', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response('ok', { status: 200 });
}); 