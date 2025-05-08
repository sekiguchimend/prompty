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

    // 3. Stripe重複防止のためのidempotencyKey設定
    const idempotencyKey = `${prompt_id}:${user_id}`;
    console.log(`Creating checkout session with idempotencyKey: ${idempotencyKey}`);

    // Stripe Checkoutセッション作成
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
      customer_email: undefined, // 必要なら追加
      metadata: {
        user_id,
        prompt_id,
        author_id,
      },
      payment_intent_data: {
        on_behalf_of: authorProfile.stripe_account_id,
        application_fee_amount: Math.floor(priceAmount * 0.1), // 10% fee
      },
    }, {
      stripeAccount: authorProfile.stripe_account_id,
      idempotencyKey: idempotencyKey // 重複防止キー
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
        payment_intent_id: session.payment_intent as string, // payment_intent_idを保存
      });
      
    if (insertError) {
      console.error('Payment record creation error:', insertError);
      // エラーがあってもセッションURLは返す（決済自体は進行可能）
    }

    res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout session creation error:', error);
    res.status(500).json({ 
      error: error.message,
      type: error.type || 'unknown',
      code: error.code || 'unknown'
    });
  }
} 