import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
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
      // 他の重要な環境変数も確認
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    };

    // セキュリティのため、キーの値は絶対に返さない
    res.status(200).json({
      status: 'Environment Variable Diagnosis',
      diagnosis,
      recommendation: stripeKey 
        ? 'Stripe key is detected. Check if it\'s the correct key.' 
        : 'STRIPE_SECRET_KEY is not set in production environment.'
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Diagnosis failed',
      message: (error as Error).message 
    });
  }
} 