import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 認証ヘッダーから認証トークンを取得
    const authHeader = req.headers.authorization;
    
      authorization: authHeader ? `Bearer ${authHeader.substring(7, 20)}...` : 'なし',
      userAgent: req.headers['user-agent'],
      method: req.method
    });

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(200).json({
        status: 'no_auth',
        message: 'Authorization ヘッダーがありません',
        headers: req.headers
      });
    }

    const sessionToken = authHeader.substring(7);
    
    // Supabaseクライアントを初期化
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${sessionToken}`
          }
        }
      }
    );

    // ユーザー情報を取得
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData.user) {
      return res.status(200).json({
        status: 'auth_failed',
        error: userError?.message || 'ユーザーデータなし',
        tokenLength: sessionToken.length
      });
    }

    // セッション情報を取得
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    return res.status(200).json({
      status: 'auth_success',
      user: {
        id: userData.user.id,
        email: userData.user.email
      },
      session: {
        hasSession: !!sessionData.session,
        sessionError: sessionError?.message
      },
      tokenInfo: {
        length: sessionToken.length,
        prefix: sessionToken.substring(0, 20)
      }
    });

  } catch (error: any) {
    console.error('認証テストエラー:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
}