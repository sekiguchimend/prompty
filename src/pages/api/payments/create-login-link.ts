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
    
    console.log(`Stripeログインリンク作成: アカウントID=${accountId}`);
    
    // アカウント情報を取得して診断
    try {
      const account = await stripe.accounts.retrieve(accountId);
      console.log('アカウント情報診断:', {
        id: account.id,
        type: account.type,  // 'express', 'standard', 'custom'のいずれか
        email: account.email,
        capabilities: account.capabilities,
        requirements: account.requirements && account.requirements.currently_due ? 
          (account.requirements.currently_due.length > 0 ? 'あり' : 'なし') : '不明'
      });
    } catch (accountError) {
      console.error('アカウント情報取得エラー:', accountError);
    }

    // ログインリンクを作成（シンプルに accountId だけを指定）
    const loginLink = await stripe.accounts.createLoginLink(accountId);

    // 詳細な診断情報を記録
    console.log('ログインリンク生成成功:', {
      url: loginLink.url.substring(0, 50) + '...',
      created: new Date().toISOString(),
      headers: req.headers.origin || 'unknown origin'
    });
    
    // クライアントに返すレスポンスを準備
    const responseData = { 
      url: loginLink.url,
      accountId: accountId,
      createdAt: new Date().toISOString()
    };
    
    res.status(200).json(responseData);
  } catch (error: any) {
    console.error('Stripeログインリンク作成エラー:', error);
    
    // エラーの種類に応じたメッセージ
    let errorMessage = error.message || 'ログインリンクの作成に失敗しました';
    let statusCode = 500;
    let errorDetails = null;
    
    // Stripeエラーの詳細なハンドリング
    if (error.type === 'StripeInvalidRequestError') {
      errorDetails = {
        type: error.type,
        code: error.code,
        param: error.param,
        detail: error.detail
      };
      
      if (error.message.includes('No such account')) {
        errorMessage = '指定されたStripeアカウントが見つかりません';
        statusCode = 404;
      } else if (error.message.includes('This account is not an Express account')) {
        errorMessage = 'このアカウントはExpressアカウントではありません';
        statusCode = 400;
      }
    }
    
    res.status(statusCode).json({ 
      error: errorMessage,
      code: error.code || 'unknown_error',
      details: errorDetails,
      timestamp: new Date().toISOString()
    });
  }
}