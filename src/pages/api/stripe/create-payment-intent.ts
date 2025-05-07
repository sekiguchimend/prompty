import type { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '../../../lib/stripe';
import { supabaseAdmin } from '../../../lib/supabaseAdminClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // POSTメソッド以外は許可しない
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, amount, currency } = req.body;
    if (!userId || !amount || !currency) {
      return res.status(400).json({ error: 'missing parameters' });
    }

    // 売り手のStripeアカウントIDを取得
    const { data, error: selErr } = await supabaseAdmin
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', userId)
      .single();

    if (selErr || !data?.stripe_account_id) {
      console.error('Supabase error or account not found:', selErr);
      return res.status(404).json({ error: 'account not found' });
    }

    // Direct Charges: on_behalf_of + application_fee_amount
    const intent = await stripe.paymentIntents.create({
      amount,
      currency,
      payment_method_types: ['card'],
      on_behalf_of: data.stripe_account_id,
      application_fee_amount: Math.floor(amount * 0.10), // 例: 10% fee
      transfer_data: undefined,
    });

    // 支払い記録をpaymentsテーブルに保存
    const { error: insErr } = await supabaseAdmin
      .from('payments')
      .insert({
        user_id: userId,
        amount,
        currency,
        intent_id: intent.id,
        status: intent.status,
      });

    if (insErr) {
      console.error('Payment record creation error:', insErr);
      // エラーをログに残すが、処理は続行する
    }

    res.status(200).json({ clientSecret: intent.client_secret });
  } catch (error: any) {
    console.error('Stripe payment intent creation error:', error);
    res.status(500).json({ error: error.message });
  }
} 