import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // POSTリクエスト以外は許可しない
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { provider } = req.body;
    
    if (!provider) {
      return res.status(400).json({ error: 'プロバイダーは必須です' });
    }
    
    // Supabaseクライアントの初期化
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // リダイレクトURL
    const redirectTo = `http://localhost:3000/auth/callback`;
    
    let result;
    
    // プロバイダー別の処理
    switch (provider.toLowerCase()) {
      case 'google': {
        // Googleサインアップへのリダイレクトをセットアップ
        result = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });
        break;
      }
        
      case 'twitter': {
        // X（Twitter）サインアップへのリダイレクトをセットアップ
        result = await supabase.auth.signInWithOAuth({
          provider: 'twitter',
          options: {
            redirectTo,
          },
        });
        break;
      }
        
      case 'apple': {
        // Appleサインアップへのリダイレクトをセットアップ
        result = await supabase.auth.signInWithOAuth({
          provider: 'apple',
          options: {
            redirectTo,
          },
        });
        break;
      }

      case 'github': {
        // GitHubサインアップへのリダイレクトをセットアップ
        result = await supabase.auth.signInWithOAuth({
          provider: 'github',
          options: {
            redirectTo,
            scopes: 'user:email', // メールアドレスにアクセスするためのスコープを指定
          },
        });
        break;
      }
        
      default:
        return res.status(400).json({ 
          error: '無効なプロバイダーです',
          error_code: 'invalid_provider',
          msg: `サポートされていないプロバイダー: ${provider}`
        });
    }
    
    const { data, error } = result;
    
    if (error) {
      const statusCode = error.status || 400;
      return res.status(statusCode).json({
        error: error.message,
        error_code: error.code || 'unknown_error',
        msg: error.message
      });
    }
    
    // リダイレクトURLを返す
    return res.status(200).json({ url: data.url });
    
  } catch (err) {
    console.error('ソーシャルサインアップエラー:', err);
    const errorMessage = err instanceof Error ? err.message : 'サーバーエラーが発生しました';
    return res.status(500).json({ 
      error: errorMessage,
      error_code: 'server_error',
      msg: errorMessage
    });
  }
} 