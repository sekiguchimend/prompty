import { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '../../../lib/stripe';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 本番環境でのみ動作（セキュリティ考慮）
  if (process.env.NODE_ENV !== 'production') {
    return res.status(403).json({ error: 'This endpoint is only available in production' });
  }

  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    
    const diagnosis = {
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
      stripeKeyExists: !!stripeKey,
      stripeKeyPrefix: stripeKey ? stripeKey.substring(0, 7) : 'undefined',
      stripeKeyLength: stripeKey ? stripeKey.length : 0,
      isLiveKey: stripeKey ? stripeKey.startsWith('sk_live_') : false,
      isTestKey: stripeKey ? stripeKey.startsWith('sk_test_') : false,
    };

    console.log('=== Stripe 設定診断 ===');
    console.log(JSON.stringify(diagnosis, null, 2));

    // Stripe API接続テスト
    let apiTestResult = null;
    try {
      console.log('🔄 Stripe API接続テスト開始...');
      
      // 最小限のAPI呼び出し（アカウント情報取得）
      const balance = await stripe.balance.retrieve();
      console.log('✅ Stripe API接続成功');
      
      apiTestResult = {
        success: true,
        currency: balance.available?.[0]?.currency,
        balanceCount: balance.available?.length || 0
      };
      
    } catch (stripeError: any) {
      console.error('❌ Stripe API接続エラー:', stripeError);
      
      apiTestResult = {
        success: false,
        error: stripeError.message,
        type: stripeError.type,
        code: stripeError.code,
        raw_code: stripeError.raw?.code
      };
    }

    res.status(200).json({
      status: 'Stripe Configuration Diagnosis',
      diagnosis,
      apiTest: apiTestResult,
      recommendation: stripeKey 
        ? (apiTestResult?.success 
            ? 'Stripe設定は正常です。' 
            : 'Stripe APIキーまたはアカウント設定に問題があります。')
        : 'STRIPE_SECRET_KEYが設定されていません。'
    });

  } catch (error) {
    console.error('❌ 診断エラー:', error);
    res.status(500).json({ 
      error: 'Diagnosis failed',
      message: (error as Error).message 
    });
  }
} 