import type { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '../../../lib/stripe';

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

  // ベースURLを設定
  // 環境変数からベースURLを取得するか、リクエストのOriginヘッダーから推測
  const baseUrl = process.env.NEXT_PUBLIC_URL || 
                 (req.headers.origin || 'http://localhost:3000');

  try {
    const { accountId } = req.body;
    if (!accountId) {
      return res.status(400).json({ error: 'accountId is required' });
    }

    // アカウントリンク作成
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/onboard?refresh=true`,
      return_url: `${baseUrl}/onboard?completed=true`,
      type: 'account_onboarding',
    });

    res.status(200).json({ url: link.url });
  } catch (error: any) {
    console.error('Stripe account link creation error:', error);
    
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