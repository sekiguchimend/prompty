import type { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '../../../lib/stripe';
import { supabaseAdmin } from '../../../lib/supabaseAdminClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 詳細ログ開始
  console.log('=== Stripe Express Account Creation API ===');
  console.log('Method:', req.method);
  console.log('Body:', JSON.stringify(req.body, null, 2));
  
  // POSTメソッド以外は許可しない
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 環境変数の詳細チェック
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  console.log('環境変数チェック:');
  console.log('- STRIPE_SECRET_KEY存在:', !!stripeKey);
  console.log('- キープレフィックス:', stripeKey ? stripeKey.substring(0, 7) : 'undefined');
  console.log('- キー長:', stripeKey ? stripeKey.length : 0);
  console.log('- 本番キー:', stripeKey ? stripeKey.startsWith('sk_live_') : false);
  console.log('- テストキー:', stripeKey ? stripeKey.startsWith('sk_test_') : false);
  
  if (!stripeKey) {
    console.error('❌ STRIPE_SECRET_KEYが設定されていません');
    return res.status(500).json({ 
      error: 'Stripe APIキーが設定されていません',
      message: 'サーバー側の設定に問題があります。管理者に連絡してください。'
    });
  }

  try {
    const { userId } = req.body;
    console.log('リクエストデータ確認:');
    console.log('- userId:', userId);
    
    if (!userId) {
      console.error('❌ userIdが提供されていません');
      return res.status(400).json({ error: 'userId is required' });
    }

    console.log('🔄 Stripe Express アカウント作成開始...');
    
    // Expressアカウント作成
    const accountParams = {
      type: 'express' as const,
      country: 'JP',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    };
    
    console.log('Stripe API パラメータ:', JSON.stringify(accountParams, null, 2));
    
    const account = await stripe.accounts.create(accountParams);
    
    console.log('✅ Stripe アカウント作成成功:', account.id);

    console.log('🔄 Supabase データベース更新開始...');
    
    // profilesテーブルにstripe_account_idを保存
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ stripe_account_id: account.id })
      .eq('id', userId);

    if (error) {
      console.error('❌ Supabase更新エラー:', error);
      return res.status(500).json({ 
        error: 'データベース更新エラー',
        details: error.message 
      });
    }

    console.log('✅ 処理完了 - アカウントID:', account.id);
    res.status(200).json({ accountId: account.id });
    
  } catch (error: any) {
    console.error('❌ エラー発生:', error);
    console.error('エラータイプ:', error.type);
    console.error('エラーコード:', error.code);
    console.error('エラーメッセージ:', error.message);
    console.error('Raw エラー:', error.raw);
    console.error('スタックトレース:', error.stack);
    
    // Stripeエラーをより詳細に分類
    if (error.type === 'StripePermissionError') {
      return res.status(500).json({ 
        error: 'Stripe APIキーの権限が不足しています',
        message: '秘密キー(Secret Key)を使用してください。公開キー(Publishable Key)ではAPIを呼び出せません。',
        code: error.code,
        raw_code: error.raw?.code
      });
    }
    
    if (error.type === 'StripeAuthenticationError') {
      return res.status(500).json({ 
        error: 'Stripe認証エラー',
        message: 'APIキーが無効または期限切れです。',
        code: error.code,
        raw_code: error.raw?.code
      });
    }
    
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(500).json({ 
        error: 'Stripe リクエストエラー',
        message: error.message,
        code: error.code,
        param: error.param,
        raw_code: error.raw?.code
      });
    }
    
    // その他のエラー
    res.status(500).json({ 
      error: 'Stripe API呼び出しエラー',
      message: error.message,
      type: error.type,
      code: error.code,
      raw_code: error.raw?.code
    });
  }
} 