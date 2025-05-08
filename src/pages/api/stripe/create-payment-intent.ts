import type { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '../../../lib/stripe';
import { supabaseAdmin } from '../../../lib/supabaseAdminClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // POSTメソッド以外は許可しない
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user_id, prompt_id, price, currency = 'jpy', stripe_price_id, author_id } = req.body;
    if (!user_id || !prompt_id || !price || !stripe_price_id || !author_id) {
      return res.status(400).json({ error: 'missing parameters' });
    }

    // リクエスト情報をログに出力（デバッグ用）
    console.log('決済リクエスト:', {
      user_id: user_id.substring(0, 8) + '...',
      prompt_id: prompt_id.substring(0, 8) + '...',
      price,
      currency,
      stripe_price_id,
      author_id: author_id.substring(0, 8) + '...'
    });

    // 価格を整数として扱う（最小通貨単位）
    const priceAmount = typeof price === 'string' ? parseInt(price, 10) : price;
    
    // 売り手のStripeアカウントIDを取得
    const { data: authorProfile, error: selErr } = await supabaseAdmin
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', author_id)
      .single();

    if (selErr || !authorProfile?.stripe_account_id) {
      console.error('Supabase error or account not found:', selErr);
      return res.status(404).json({ error: 'account not found' });
    }

    // Stripe側で価格IDの存在確認
    try {
      // 直接価格情報を取得して存在確認
      await stripe.prices.retrieve(stripe_price_id, {
        stripeAccount: authorProfile.stripe_account_id
      });
      console.log(`価格ID確認成功: ${stripe_price_id}`);
    } catch (priceError: any) {
      console.error('価格ID検証エラー:', priceError);
      
      // DB情報を再確認
      const { data: promptData } = await supabaseAdmin
        .from('prompts')
        .select('id, title, price, stripe_product_id, stripe_price_id')
        .eq('id', prompt_id)
        .single();
        
      return res.status(400).json({ 
        error: '価格情報が見つかりません。Stripe連携に問題があります。',
        message: priceError.message,
        prompt_info: promptData ? {
          id: promptData.id,
          price: promptData.price,
          stripe_price_id: promptData.stripe_price_id
        } : 'no data'
      });
    }

    // 3. Stripe重複防止のためのidempotencyKey設定
    const idempotencyKey = `${prompt_id}:${user_id}`;
    console.log(`Creating checkout session with idempotencyKey: ${idempotencyKey}`);

    // アプリケーションの手数料（10%）
    const applicationFee = Math.floor(priceAmount * 0.1);
    const sellerAmount = priceAmount - applicationFee;

    // Stripe Checkoutセッション作成 - 連携アカウントへの送金設定
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: stripe_price_id,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_URL}/prompts/${prompt_id}?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/prompts/${prompt_id}?canceled=1`,
      metadata: {
        user_id,
        prompt_id,
        author_id,
      },
      payment_intent_data: {
        // on_behalf_ofの代わりにtransfer_dataを使用
        transfer_data: {
          destination: authorProfile.stripe_account_id,
        },
        application_fee_amount: applicationFee, // 10% fee
      },
    }, {
      // ここではstripeAccountを指定しない
      idempotencyKey: idempotencyKey
    });

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