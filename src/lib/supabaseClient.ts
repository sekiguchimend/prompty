// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

// 環境変数からSupabase接続情報を取得
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// シングルトンパターンでクライアントインスタンスを管理
let supabaseInstance: ReturnType<typeof createClient> | null = null;

// クライアントオプションを設定
const supabaseOptions = {
  auth: {
    persistSession: true, // セッションをloalStorageに保存
    autoRefreshToken: true, // トークンの自動リフレッシュを有効化
    detectSessionInUrl: true, // URLからセッション情報を検出
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
      'Accept': '*/*',
      'X-Client-Info': 'supabase-js/2.0.0',
      'Prefer': 'return=representation'
    },
  },
  // リアルタイムの設定値を調整
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
};

// Supabaseクライアントを取得する関数（シングルトンパターン）
export const getSupabaseClient = () => {
  if (supabaseInstance) return supabaseInstance;
  
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, supabaseOptions);
  return supabaseInstance;
};

// 後方互換性のために残す
export const supabase = getSupabaseClient();

// 最適化されたセッション初期化（必要な場合のみセッションをリフレッシュする）
export const initializeSupabaseSession = async () => {
  try {
    // クライアントサイドでのみ実行
    if (typeof window === 'undefined') return false;
    
    // すでにセッションがある場合は再利用
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      console.log('既存のセッションを使用');
      return true;
    }
    
    // ローカルストレージからセッションを復元
    const storedSession = localStorage.getItem('sb-' + supabaseUrl.split('//')[1].split('.')[0] + '-auth-token');
    
    if (storedSession) {
      try {
        const parsedSession = JSON.parse(storedSession);
        if (parsedSession?.access_token && parsedSession?.refresh_token) {
          // セッションを復元
          await supabase.auth.setSession({
            access_token: parsedSession.access_token,
            refresh_token: parsedSession.refresh_token
          });
          
          // セッションのリフレッシュを試みる
          const { error } = await supabase.auth.refreshSession();
          if (!error) {
            console.log('Supabaseセッションを復元しました');
            return true;
          }
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
    // キャッシュを活用するため、getSessionの呼び出し回数を最小限に
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
