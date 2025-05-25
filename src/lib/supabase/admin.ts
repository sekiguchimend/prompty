import { createClient } from '@supabase/supabase-js';

// 環境変数からSupabase接続情報を取得
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// 環境変数チェック
if (!supabaseUrl) {
  console.error('NEXT_PUBLIC_SUPABASE_URLが設定されていません');
}

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEYが設定されていません');
}

// 管理者クライアントオプションを設定
const supabaseAdminOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
      'Accept': '*/*',
      'X-Client-Info': 'supabase-js-admin/2.0.0'
    },
  },
};

// シングルトンパターンで管理者クライアントインスタンスを管理
let supabaseAdminInstance: ReturnType<typeof createClient> | null = null;

/**
 * 管理者権限のSupabaseクライアントを取得する関数
 * このクライアントはサーバーサイドでのみ使用してください
 */
export const getSupabaseAdmin = () => {
  if (typeof window !== 'undefined') {
    console.warn('警告: supabaseAdminクライアントはサーバーサイドでのみ使用してください');
  }
  
  if (supabaseAdminInstance) return supabaseAdminInstance;
  
  if (!supabaseServiceKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEYが設定されていません');
    throw new Error('管理者キーが設定されていません。環境変数を確認してください。');
  }
  
  supabaseAdminInstance = createClient(
    supabaseUrl, 
    supabaseServiceKey,
    supabaseAdminOptions
  );
  return supabaseAdminInstance;
};

// サーバーサイドのみで使用するためのクライアントエクスポート
export const supabaseAdmin = getSupabaseAdmin();

// デフォルトエクスポート
export default supabaseAdmin; 