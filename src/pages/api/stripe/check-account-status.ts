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

  try {
    const { accountId } = req.body;
    
    if (!accountId) {
      return res.status(400).json({ error: 'accountId is required' });
    }
    
    console.log(`Stripeアカウント状態確認: アカウントID=${accountId}`);
    
    // アカウント情報を取得
    const account = await stripe.accounts.retrieve(accountId);
    
    // アカウントの状態を判定
    const isComplete = account.charges_enabled && account.payouts_enabled;
    const requirementsCount = account.requirements?.currently_due?.length || 0;
    
    const status = isComplete ? 'complete' : 
                   requirementsCount > 0 ? 'pending' : 'incomplete';
    
    console.log('アカウント状態:', {
      id: account.id,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      requirements_count: requirementsCount,
      status: status
    });
    
    res.status(200).json({
      status: status,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      requirements: {
        currently_due: account.requirements?.currently_due || [],
        eventually_due: account.requirements?.eventually_due || [],
        past_due: account.requirements?.past_due || []
      }
    });
  } catch (error: any) {
    console.error('Stripeアカウント状態確認エラー:', error);
    
    if (error.type === 'StripeInvalidRequestError') {
      res.status(400).json({
        error: 'Invalid Stripe account ID',
        message: error.message
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to check account status',
        message: error.message
      });
    }
  }
} 