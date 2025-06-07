import type { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '../../../lib/stripe';
import { supabaseAdmin } from '../../../lib/supabaseAdminClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // POSTメソッド以外は許可しない
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 環境変数のチェック
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEYが設定されていません');
    return res.status(500).json({ 
      error: 'Stripe APIキーが設定されていません',
      message: 'サーバー側の設定に問題があります。管理者に連絡してください。'
    });
  }

  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Expressアカウント作成
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'JP',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    // profilesテーブルにstripe_account_idを保存
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ stripe_account_id: account.id })
      .eq('id', userId);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json({ accountId: account.id });
  } catch (error: any) {
    console.error('Stripe account creation error:', error);
    
    // Stripeエラーをより詳細に分類
    if (error.type === 'StripePermissionError') {
      return res.status(500).json({ 
        error: 'Stripe APIキーの権限が不足しています',
        message: '秘密キー(Secret Key)を使用してください。公開キー(Publishable Key)ではAPIを呼び出せません。',
        code: error.raw?.code
      });
    }
    
    res.status(500).json({ 
      error: error.message,
      code: error.raw?.code,
      type: error.type
    });
  }
} 