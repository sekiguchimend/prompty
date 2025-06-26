import { NextApiRequest } from 'next';
import { supabase } from '../lib/supabase-unified';

// APIリクエストのユーザー認証を確認するヘルパー関数
export async function isAuthenticated(req: NextApiRequest) {
  try {
    // Authorization ヘッダーからトークンを取得
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // トークンを検証
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      console.error('トークン検証エラー:', error);
      return null;
    }
    
    return data.user;
  } catch (error) {
    console.error('認証処理エラー:', error);
    return null;
  }
} 