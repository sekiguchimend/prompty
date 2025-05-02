import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

// 環境変数から値を取得
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// シングルトンパターンでクライアントインスタンスを管理
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null;

// クライアントオプションを設定
const supabaseOptions = {
  auth: {
    persistSession: true, // セッションをlocalStorageに保存
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
  
  supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, supabaseOptions);
  return supabaseInstance;
};

// 簡易アクセス用のエクスポート（互換性維持のため）
export const supabase = getSupabaseClient();

// 最適化されたセッション初期化
export const initializeSupabaseSession = async () => {
  try {
    // クライアントサイドでのみ実行
    if (typeof window === 'undefined') return false;
    
    // 現在のセッションを取得
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (sessionData.session) {
      // 期限チェック
      const expiresAt = new Date(sessionData.session.expires_at || 0).getTime();
      const now = new Date().getTime();
      
      // 有効期限が10分以内の場合はリフレッシュ
      if (expiresAt <= now + 600000) {
        console.log('セッションの期限が近いためリフレッシュ...');
        const { error } = await supabase.auth.refreshSession();
        if (error) {
          console.error('セッションリフレッシュエラー:', error);
          return false;
        }
      }
      return true;
    }
    
    // セッションが存在しない場合、ローカルストレージからの復元を試みる
    const supabaseKey = 'sb-' + supabaseUrl.split('//')[1].split('.')[0] + '-auth-token';
    const storedSession = localStorage.getItem(supabaseKey);
    
    if (storedSession) {
      try {
        const parsedSession = JSON.parse(storedSession);
        if (parsedSession?.access_token && parsedSession?.refresh_token) {
          // セッションを復元
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: parsedSession.access_token,
            refresh_token: parsedSession.refresh_token
          });
          
          if (setSessionError) {
            console.error('保存済みセッションの設定エラー:', setSessionError);
            // エラーがあった場合は保存データをクリア
            localStorage.removeItem(supabaseKey);
            return false;
          }
          
          // セッションのリフレッシュを試みる
          const { error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            console.error('セッションリフレッシュエラー:', refreshError);
            // リフレッシュに失敗した場合も保存データをクリア
            localStorage.removeItem(supabaseKey);
            return false;
          }
          
          console.log('Supabaseセッションを正常に復元・リフレッシュしました');
          return true;
        }
      } catch (e) {
        console.error('ストレージから取得したセッションの解析に失敗:', e);
        // エラーの場合は保存データをクリア
        localStorage.removeItem(supabaseKey);
      }
    }
    
    // 最後の手段として、現在のユーザー情報を取得
    const { data, error } = await supabase.auth.getUser();
    return !!data.user && !error;
  } catch (error) {
    console.error('Supabaseセッション初期化エラー:', error);
    return false;
  }
};

// 改良版セッション検証関数
export const validateSession = async () => {
  try {
    // セッションを取得
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('セッション検証エラー:', error);
      return false;
    }
    
    if (!data.session) {
      console.log('セッションが存在しません');
      return false;
    }
    
    // トークンの期限をチェック
    const expiresAt = new Date(data.session.expires_at || 0).getTime();
    const now = new Date().getTime();
    
    // 期限切れの場合はリフレッシュを試みる
    if (expiresAt <= now + 60000) { // 1分以内に期限切れの場合も含む
      console.log('トークンの期限が近いためリフレッシュ試行...');
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('トークンリフレッシュエラー:', refreshError);
        return false;
      }
      
      return !!refreshData.session;
    }
    
    return true;
  } catch (e) {
    console.error('セッション検証中の例外:', e);
    return false;
  }
};

// セッション情報をクリア（トラブルシューティング用）
export const clearSupabaseSession = () => {
  try {
    if (typeof window === 'undefined') return;
    
    // Supabaseの標準セッションキーを特定
    const supabaseKey = 'sb-' + supabaseUrl.split('//')[1].split('.')[0] + '-auth-token';
    localStorage.removeItem(supabaseKey);
    
    console.log('セッションデータをクリアしました');
  } catch (e) {
    console.error('セッションクリアエラー:', e);
  }
};