// lib/supabaseClient.ts
// 互換性のためのリダイレクトファイル
// このファイルは非推奨です。今後は 'lib/supabase/client' から直接インポートしてください。

// メインのSupabaseクライアント - セキュア版を使用
export { supabase } from './supabase/client-secure';
export { supabaseAdmin } from './supabase/admin-secure';

// デフォルトエクスポート
export { supabase as default } from './supabase/client-secure';
