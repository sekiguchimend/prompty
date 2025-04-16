// src/pages/api/auth/signup.ts
import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // POSTリクエスト以外は許可しない
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, username } = req.body;
    
    // 入力データの検証
    if (!email || !password) {
      return res.status(400).json({ error: 'メールアドレスとパスワードは必須です' });
    }
    
    // Supabaseクライアントの初期化
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // ユーザー登録処理
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`,
        data: {
          // auth.usersにカスタムデータを保存（オプション）
          preferred_username: username || undefined,
        }
      }
    });
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    // ユーザー名が提供された場合は、プロフィールを更新
    if (username && data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ username })
        .eq('id', data.user.id);
        
      if (profileError) {
        console.error('プロフィール更新エラー:', profileError);
        // ここではユーザー作成は成功しているので、エラーを返さず続行
      }
    }
    
    return res.status(200).json({ 
      message: 'ユーザー登録が完了しました。メールを確認してください。',
      user: data.user 
    });
    
  } catch (err) {
    console.error('サインアップエラー:', err);
    return res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
}