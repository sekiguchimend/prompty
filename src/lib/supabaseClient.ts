// lib/supabaseClient.ts
// 互換性のためのリダイレクトファイル
// このファイルは非推奨です。今後は 'lib/supabase/client' から直接インポートしてください。

import {
  supabase,
  getSupabaseClient,
  initializeSupabaseSession,
  validateSession
} from '../../lib/supabase/client';

// 既存コードの互換性のために再エクスポート
export {
  supabase,
  getSupabaseClient,
  initializeSupabaseSession,
  validateSession
};

// デフォルトエクスポート（一部のインポート方式との互換性のため）
export default supabase;
