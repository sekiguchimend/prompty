// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

// 環境変数からSupabase接続情報を取得
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// クライアントオプションを設定
const supabaseOptions = {
  auth: {
    persistSession: true, // セッションをloalStorageに保存
    autoRefreshToken: true, // トークンの自動リフレッシュを有効化
    detectSessionInUrl: true, // URLからセッション情報を検出
    storage: {
      getItem: (key: string) => {
        if (typeof window === 'undefined') return null;
        return window.localStorage.getItem(key);
      },
      setItem: (key: string, value: string) => {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem(key, value);
      },
      removeItem: (key: string) => {
        if (typeof window === 'undefined') return;
        window.localStorage.removeItem(key);
      }
    }
  }
};

// Supabaseクライアントを作成
export const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseOptions);

// ページロード時のセッション復元を確実にする関数
export const initializeSupabaseSession = async () => {
  try {
    const storedSession = localStorage.getItem('sb-' + supabaseUrl.split('//')[1].split('.')[0] + '-auth-token');
    
    if (storedSession) {
      try {
        const session = JSON.parse(storedSession);
        if (session?.access_token && session?.refresh_token) {
          // セッションを復元
          await supabase.auth.setSession({
            access_token: session.access_token,
            refresh_token: session.refresh_token
          });
          
          // セッションのリフレッシュを試みる
          await supabase.auth.refreshSession();
          
          console.log('Supabaseセッションを復元しました');
          return true;
        }
      } catch (e) {
        console.error('ストレージから取得したセッションの解析に失敗:', e);
      }
    }
    
    return false;
  } catch (error) {
    console.error('Supabaseセッション初期化エラー:', error);
    return false;
  }
};

// 定期的なセッション検証関数
export const validateSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('セッション検証エラー:', error);
      return false;
    }
    
    return !!data.session;
  } catch (e) {
    console.error('セッション検証中の例外:', e);
    return false;
  }
};
