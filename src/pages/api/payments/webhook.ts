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
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event);
        break;
      // 他のイベントがあれば追加
      default:
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// 支払い成功時の処理
async function handlePaymentIntentSucceeded(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  
  try {
    // 支払いステータスを更新
    const { error } = await supabaseAdmin
      .from('payments')
      .update({ 
        status: 'succeeded', 
        updated_at: new Date().toISOString() 
      })
      .eq('payment_intent_id', paymentIntent.id);

    if (error) {
    } else {
      
      // purchasesテーブルにも登録（冪等性のため重複チェック）
      const { data: existingPurchase } = await supabaseAdmin
        .from('purchases')
        .select('id')
        .eq('payment_intent_id', paymentIntent.id)
        .maybeSingle();
        
      if (!existingPurchase) {
        // メタデータから購入情報を取得
        const metadata = paymentIntent.metadata;
        if (metadata && metadata.prompt_id && metadata.user_id) {
          await supabaseAdmin.from('purchases').insert({
            user_id: metadata.user_id,
            prompt_id: metadata.prompt_id,
            payment_intent_id: paymentIntent.id,
            status: 'completed'
          });
        }
      }
    }
  } catch (error) {
  }
}

// 支払い失敗時の処理
async function handlePaymentIntentFailed(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  
  try {
    // 支払いステータスを更新
    const { error } = await supabaseAdmin
      .from('payments')
      .update({ 
        status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('payment_intent_id', paymentIntent.id);

    if (error) {
    } else {
    }
  } catch (error) {
  }
}

// Checkout Session完了時の処理
async function handleCheckoutSessionCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  
  if (!session.id) {
    return;
  }
  
  try {
    // 1. Checkoutセッションからメタデータとpayment_intentを取得
    const paymentIntentId = session.payment_intent as string;
    const metadata = session.metadata || {};
    
    // 2. paymentsテーブルをcheckout_session_idで更新
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .update({ 
        status: 'paid',
        payment_intent_id: paymentIntentId, // セッションから取得したpayment_intentを保存
        updated_at: new Date().toISOString()
      })
      .eq('checkout_session_id', session.id)
      .select()
      .single();

    if (paymentError) {
      
      // 3. checkout_session_idで見つからない場合、payment_intent_idで再試行
      if (paymentIntentId) {
        const { error: retryError } = await supabaseAdmin
          .from('payments')
          .update({ 
            status: 'paid',
            checkout_session_id: session.id,
            updated_at: new Date().toISOString() 
          })
          .eq('payment_intent_id', paymentIntentId);
          
        if (retryError) {
        } else {
        }
      }
    } else {
    }
    
    // 4. purchasesテーブルにも登録（冪等性のため重複チェック）
    if (metadata.user_id && metadata.prompt_id) {
      const { data: existingPurchase } = await supabaseAdmin
        .from('purchases')
        .select('id')
        .eq('prompt_id', metadata.prompt_id)
        .eq('user_id', metadata.user_id)
        .maybeSingle();
        
      if (!existingPurchase) {
        await supabaseAdmin.from('purchases').insert({
          user_id: metadata.user_id,
          prompt_id: metadata.prompt_id,
          payment_intent_id: paymentIntentId,
          checkout_session_id: session.id,
          status: 'completed'
        });
        console.log('Purchase record created');
      } else {
      }
    } else {
    }
  } catch (error) {
  }
} 