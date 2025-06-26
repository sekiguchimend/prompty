// lib/supabaseClient.ts
// 統一されたSupabaseクライアントを使用

// メインのSupabaseクライアント - 統一版を使用
export { supabase } from './supabase-unified';

// デフォルトエクスポート
export { supabase as default } from './supabase-unified';

// 管理者クライアントは必要な場合のみ動的にインポート
export const getSupabaseAdmin = async () => {
  if (typeof window !== 'undefined') {
    // クライアントサイドでは管理者クライアントを使用しない
    throw new Error('Admin client should not be used on client side');
  }
  
  const { supabaseAdmin } = await import('./supabase/admin-secure');
  return supabaseAdmin;
};
