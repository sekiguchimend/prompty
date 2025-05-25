import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabaseClient';
import { createServerClient } from '@supabase/ssr';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GETリクエストのみ受け付ける
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // サーバーサイドのSupabaseクライアントを作成（PagesルーターではreqからCookieを取得）
  const supabaseServerClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // Pagesルーターでは、req.cookiesからクッキーを取得
          return req.cookies[name];
        },
      },
    }
  );
  
  try {
    // セッションを取得して認証を確認
    const { data: { session } } = await supabaseServerClient.auth.getSession();
    
    // 未認証の場合はエラーを返す
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const userId = session.user.id;
    const { prompt_id: promptId } = req.query;
    
    // プロンプトIDの検証
    if (!promptId) {
      return res.status(400).json({ error: 'Prompt ID is required' });
    }
    
    // いいねの状態を確認
    const { data, error } = await supabase
      .from('likes')
      .select('id')
      .eq('prompt_id', promptId)
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116はレコードが見つからないエラー
      throw error;
    }
    
    return res.status(200).json({
      liked: !!data
    });
    
  } catch (error) {
    console.error('いいね状態確認エラー:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 