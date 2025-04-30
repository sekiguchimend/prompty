// src/lib/supabaseAdminClient.ts
// 互換性のためのリダイレクトファイル
// このファイルは非推奨です。今後は 'lib/supabase/admin' から直接インポートしてください。

import {
  supabaseAdmin,
  getSupabaseAdmin
} from '../../lib/supabase/admin';

// 既存コードの互換性のために再エクスポート
export {
  supabaseAdmin,
  getSupabaseAdmin
};

// デフォルトエクスポート（一部のインポート方式との互換性のため）
export default supabaseAdmin; 