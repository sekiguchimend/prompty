import type { NextApiRequest, NextApiResponse } from 'next';
// 共通のSupabaseクライアントを使用
import { supabase } from '../../../../lib/supabase/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // POSTリクエスト以外は許可しない
  if (req.method !== 'POST') {
    console.log('サインイン: HTTPメソッドエラー', { method: req.method });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;
    
    console.log('サインイン試行:', { 
      email, 
      passwordProvided: !!password,
      passwordLength: password?.length
    });
    
    // 入力データの検証
    if (!email || !password) {
      console.log('サインイン: 入力データ不足', { emailProvided: !!email, passwordProvided: !!password });
      return res.status(400).json({ error: 'メールアドレスとパスワードは必須です' });
    }
    
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Supabase Key形式:', typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    // サインイン処理
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    console.log('サインイン結果:', { 
      success: !error,
      hasUser: !!data?.user,
      hasSession: !!data?.session,
      errorCode: error?.status,
      errorMessage: error?.message
    });
    
    if (error) {
      // ローカル開発環境でメール確認のエラーをバイパス
      if (error.message.includes('Email not confirmed') && 
          (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_BYPASS_EMAIL_CONFIRMATION === 'true')) {
        
        console.log('開発環境: メール確認エラーをバイパスします');
        
        // 開発環境用に簡易的なユーザー情報とセッション情報を返す
        const fakeSession = {
          access_token: 'dev_mode_token',
          refresh_token: 'dev_mode_refresh',
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          user: {
            id: 'dev_user_id',
            email: email,
            role: 'authenticated',
            aud: 'authenticated',
            created_at: new Date().toISOString()
          }
        };
        
        // Cookieを設定
        res.setHeader('Set-Cookie', [
          `sb-access-token=${fakeSession.access_token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`,
          `sb-refresh-token=${fakeSession.refresh_token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
        ]);
        
        console.log('開発環境: 簡易セッション情報を返します');
        return res.status(200).json({
          message: '開発環境: メール確認をスキップしてログインしました',
          user: fakeSession.user,
          session: fakeSession
        });
      }
      
      // その他のエラー処理
      let statusCode = 400;
      let errorMessage = error.message;
      
      // エラーの種類に応じてメッセージをカスタマイズ
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'メールアドレスまたはパスワードが正しくありません';
      } else if (error.message.includes('Email not confirmed')) {
        statusCode = 401;
        errorMessage = 'メールアドレスが確認されていません。メールをご確認ください。';
      }
      
      console.log('サインインエラー詳細:', { statusCode, errorMessage });
      return res.status(statusCode).json({ 
        error: errorMessage,
        error_code: error.name || 'auth_error'
      });
    }
    
    // セッションとユーザー情報を返す
    console.log('サインイン成功', { 
      userId: data.user?.id,
      email: data.user?.email,
      hasSession: !!data.session
    });
    
    if (data.session) {
      // Cookieを設定
      res.setHeader('Set-Cookie', [
        `sb-access-token=${data.session.access_token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`,
        `sb-refresh-token=${data.session.refresh_token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
      ]);
    }
    
    return res.status(200).json({
      message: 'ログインに成功しました',
      session: data.session,
      user: data.user
    });
    
  } catch (err) {
    console.error('サインイン予期せぬエラー:', err);
    return res.status(500).json({ 
      error: 'サーバーエラーが発生しました',
      error_code: 'server_error' 
    });
  }
} 