import type { NextApiRequest, NextApiResponse } from 'next';
import { parse } from 'cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GETリクエスト以外は許可しない
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('==================== GET-USER API ====================');
    console.log('📥 get-user API呼び出し', new Date().toISOString());
    
    // 開発モード：常にデモユーザーを返す
    console.log('⚠️ デモユーザーモード：常に有効なユーザーIDを返します');
    
    // 実際の本番環境では、Cookieからセッショントークンを取得して
    // Supabaseの認証状態を確認するべきですが、開発用に常に成功を返します
    
    return res.status(200).json({
      user: {
        id: '00000000-0000-0000-0000-000000000000',
        email: 'demo@example.com',
        app_metadata: { provider: 'demo' },
        user_metadata: { name: 'デモユーザー' },
        aud: 'authenticated',
        created_at: new Date().toISOString()
      },
      source: 'demo_user'
    });
    
  } catch (err) {
    console.error('❌ サーバーエラー:', err);
    
    // エラーが発生しても、開発用に常にデモユーザーを返す
    return res.status(200).json({
      user: {
        id: '00000000-0000-0000-0000-000000000000',
        email: 'error_demo@example.com',
        app_metadata: { provider: 'demo' },
        user_metadata: { name: 'エラー発生時のデモユーザー' },
        aud: 'authenticated',
        created_at: new Date().toISOString()
      },
      source: 'error_fallback'
    });
  }
} 