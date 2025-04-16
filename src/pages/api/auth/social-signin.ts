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
    const redirectTo = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`;
    
    let result;
    
    // プロバイダー別の処理
    switch (provider) {
      case 'google':
      case 'Google':
        // Handle Google login
        try {
          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: redirectTo,
              scopes: 'email profile',
            },
          });

          if (error) {
            return res.status(400).json({ 
              error: error.message,
              error_code: error.code || 'authentication_error',
              msg: error.message 
            });
          }

          return res.status(200).json({ url: data.url });
        } catch (error: any) {
          return res.status(500).json({ 
            error: error.message,
            error_code: 'server_error',
            msg: 'Error during Google sign-in' 
          });
        }
        
      case 'github':
        // Handle GitHub login
        try {
          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: {
              redirectTo: redirectTo,
            },
          });

          if (error) {
            return res.status(400).json({ 
              error: error.message,
              error_code: error.code || 'authentication_error',
              msg: error.message 
            });
          }

          return res.status(200).json({ url: data.url });
        } catch (error: any) {
          return res.status(500).json({ 
            error: error.message,
            error_code: 'server_error',
            msg: 'Error during GitHub sign-in' 
          });
        }
      
      case 'twitter':
        // Handle Twitter login
        try {
          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'twitter',
            options: {
              redirectTo: redirectTo,
            },
          });

          if (error) {
            return res.status(400).json({ 
              error: error.message,
              error_code: error.code || 'authentication_error',
              msg: error.message 
            });
          }

          return res.status(200).json({ url: data.url });
        } catch (error: any) {
          return res.status(500).json({ 
            error: error.message,
            error_code: 'server_error',
            msg: 'Error during Twitter sign-in' 
          });
        }
        
      case 'apple': {
        // Appleサインインへのリダイレクトをセットアップ
        result = await supabase.auth.signInWithOAuth({
          provider: 'apple',
          options: {
            redirectTo,
          },
        });
        break;
      }
      
      default:
        return res.status(400).json({ 
          error: `Unsupported provider: ${provider}`,
          error_code: 'invalid_provider',
          msg: `プロバイダー「${provider}」はサポートされていません` 
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
    console.error('ソーシャルサインインエラー:', err);
    const errorMessage = err instanceof Error ? err.message : 'サーバーエラーが発生しました';
    return res.status(500).json({ 
      error: errorMessage,
      error_code: 'server_error',
      msg: errorMessage
    });
  }
} 