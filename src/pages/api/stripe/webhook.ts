import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import getRawBody from 'raw-body';
import { stripe } from '../../../lib/stripe';
import { supabaseAdmin } from '../../../lib/supabaseAdminClient';

// Bodyパーサーを無効化して生のリクエストボディを取得できるようにする
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let event: Stripe.Event;
  
  try {
    // リクエストボディの生データを取得
    const buf = await getRawBody(req);
    const sig = req.headers['stripe-signature'] as string;

    // Stripeイベントの検証
    try {
      event = stripe.webhooks.constructEvent(
        buf,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET as string
      );
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // イベントタイプに応じた処理
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event);
        break;
      // 他のイベントがあれば追加
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: error.message });
  }
}

// 支払い成功時の処理
async function handlePaymentIntentSucceeded(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  
  // 支払いステータスを更新
  const { error } = await supabaseAdmin
    .from('payments')
    .update({ status: 'succeeded' })
    .eq('intent_id', paymentIntent.id);

  if (error) {
    console.error('Error updating payment status:', error);
  }
}

// 支払い失敗時の処理
async function handlePaymentIntentFailed(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  
  // 支払いステータスを更新
  const { error } = await supabaseAdmin
    .from('payments')
    .update({ status: 'failed' })
    .eq('intent_id', paymentIntent.id);

  if (error) {
    console.error('Error updating payment status:', error);
  }
} 