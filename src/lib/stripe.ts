import Stripe from 'stripe';

// 環境変数チェック
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEYが設定されていません。.env.localファイルを確認してください。');
}

// Stripeクライアントを初期化
export const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || '', // デフォルト値として空文字を設定
  { apiVersion: '2025-04-30.basil' }
); 