import type { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '../../../lib/stripe';
import { supabaseAdmin } from '../../../lib/supabaseAdminClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // POSTメソッド以外は許可しない
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user_id, prompt_id, price, currency = 'jpy', stripe_price_id, author_id, title } = req.body;
    if (!user_id || !prompt_id || !price) {
      return res.status(400).json({ error: 'missing parameters' });
    }

    // リクエスト情報をログに出力（デバッグ用）
    console.log('決済リクエスト:', {
      user_id: user_id.substring(0, 8) + '...',
      prompt_id: prompt_id.substring(0, 8) + '...',
      price,
      currency,
      stripe_price_id: stripe_price_id || 'なし',
      author_id: author_id?.substring(0, 8) + '...'
    });

    // 価格を整数として扱う（最小通貨単位）
    const priceAmount = typeof price === 'string' ? parseInt(price, 10) : price;
    
    // プロンプト情報を取得（Stripe連携情報確認と不足情報補完のため）
    const { data: promptData, error: promptError } = await supabaseAdmin
      .from('prompts')
      .select('id, title, price, author_id, stripe_product_id, stripe_price_id')
      .eq('id', prompt_id)
      .single();
    
    if (promptError || !promptData) {
      console.error('プロンプト情報取得エラー:', promptError);
      return res.status(404).json({ error: 'prompt not found' });
    }
    
    // 不足情報を補完
    const promptTitle = title || promptData.title;
    const promptAuthorId = author_id || promptData.author_id;
    let promptPriceId = stripe_price_id || promptData.stripe_price_id;
    
    // 売り手のStripeアカウントIDを取得
    const { data: authorProfile, error: selErr } = await supabaseAdmin
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', promptAuthorId)
      .single();

    if (selErr || !authorProfile?.stripe_account_id) {
      console.error('Supabase error or account not found:', selErr);
      return res.status(404).json({ error: 'author stripe account not found' });
    }

    let priceValidated = false;
    
    // Stripe側で価格IDの存在確認
    if (promptPriceId) {
      try {
        // 直接価格情報を取得して存在確認
        await stripe.prices.retrieve(promptPriceId, {
          stripeAccount: authorProfile.stripe_account_id
        });
        console.log(`価格ID確認成功: ${promptPriceId}`);
        priceValidated = true;
      } catch (priceError: any) {
        console.error('価格ID検証エラー:', priceError);
        // 価格IDが無効な場合は新規作成するため、エラーをスローしない
        priceValidated = false;
      }
    }
    
    // 価格IDが無効または存在しない場合は、その場でStripe製品・価格を作成
    if (!priceValidated) {
      console.log('有効な価格IDが見つからないため、Stripe製品・価格を新規作成します');
      
      try {
        // Stripe製品作成
        const product = await stripe.products.create({
          name: promptTitle,
          metadata: { prompt_id: prompt_id },
          default_price_data: {
            unit_amount: priceAmount,
            currency: currency,
          },
        }, { 
          stripeAccount: authorProfile.stripe_account_id,
          idempotencyKey: `product_${prompt_id}`
        });
        
        // 製品IDから価格IDを取得
        promptPriceId = typeof product.default_price === 'string' 
          ? product.default_price 
          : product.default_price?.id;
          
        if (!promptPriceId) {
          throw new Error('価格IDの取得に失敗しました');
        }
        
        console.log('Stripe製品・価格作成成功:', {
          product_id: product.id,
          price_id: promptPriceId
        });
        
        // promptsテーブルを更新
        await supabaseAdmin.from('prompts')
          .update({
            stripe_product_id: product.id,
            stripe_price_id: promptPriceId
          })
          .eq('id', prompt_id);
          
        priceValidated = true;
      } catch (createError: any) {
        console.error('Stripe製品・価格作成エラー:', createError);
        return res.status(500).json({ 
          error: 'Stripe製品・価格の作成に失敗しました',
          message: createError.message
        });
      }
    }

    // 3. Stripe重複防止のためのidempotencyKey設定
    const idempotencyKey = `${prompt_id}:${user_id}`;
    console.log(`Creating checkout session with idempotencyKey: ${idempotencyKey}`);

    // アプリケーションの手数料（10%）
    const applicationFee = Math.floor(priceAmount * 0.1);
    const sellerAmount = priceAmount - applicationFee;

    // Stripe Checkoutセッション作成 - プラットフォームから接続アカウントへ送金する設定
    const session = await stripe.checkout.sessions.create(
      {
        payment_method_types: ['card'],
        line_items: [
          {
            // 接続アカウント側のpriceIdは使用せず、単価と数量を直接指定する
            price_data: {
              currency: currency,
              unit_amount: priceAmount,
              product_data: {
                name: promptTitle,
                metadata: { prompt_id: prompt_id }
              }
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_URL}/prompts/${prompt_id}?success=1`,
        cancel_url: `${process.env.NEXT_PUBLIC_URL}/prompts/${prompt_id}?canceled=1`,
        metadata: {
          user_id,
          prompt_id,
          author_id: promptAuthorId,
        },
        payment_intent_data: {
          transfer_data: { destination: authorProfile.stripe_account_id },
          application_fee_amount: applicationFee,
        },
      },
      {
        // プラットフォームのコンテキストで作成するため、stripeAccountは不要
        idempotencyKey: idempotencyKey
      }
    );

    // paymentsテーブルに仮レコードを保存（status=pending）
    const { error: insertError } = await supabaseAdmin
      .from('payments')
      .insert({
        user_id,
        prompt_id,
        amount: priceAmount,
        currency,
        status: 'pending',
        checkout_session_id: session.id,
        payment_intent_id: session.payment_intent as string,
      });
      
    if (insertError) {
      console.error('Payment record creation error:', insertError);
      // エラーがあってもセッションURLは返す（決済自体は進行可能）
    }

    console.log('Checkout session created successfully:', session.id);
    res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout session creation error:', error);
    
    // エラー種類によって異なるレスポンスを返す
    if (error.type === 'StripeInvalidRequestError') {
      if (error.message.includes('No such price')) {
        res.status(400).json({
          error: '有効な価格IDが見つかりません。プロンプトのStripe連携を確認してください。',
          type: error.type,
          code: error.code
        });
      } else {
        res.status(400).json({
          error: 'Stripeリクエストエラー: ' + error.message,
          type: error.type,
          code: error.code
        });
      }
    } else {
      res.status(500).json({ 
        error: error.message,
        type: error.type || 'unknown',
        code: error.code || 'unknown'
      });
    }
  }
} 