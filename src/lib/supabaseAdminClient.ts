// src/lib/supabaseAdminClient.ts
// 互換性のためのリダイレクトファイル
// このファイルは非推奨です。今後は 'lib/supabase/admin' から直接インポートしてください。

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

// 管理者クライアントを作成
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// デフォルトエクスポート
export default supabaseAdmin; 