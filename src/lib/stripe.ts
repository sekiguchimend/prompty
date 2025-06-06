import Stripe from 'stripe';

// 環境変数チェック
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('⚠️ STRIPE_SECRET_KEY が設定されていません。');
}

// ここには必ず「プラットフォーム」のキーを入れる
export const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY!
); 