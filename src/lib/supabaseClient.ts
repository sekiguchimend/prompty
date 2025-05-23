// lib/supabaseClient.ts
// 互換性のためのリダイレクトファイル
// このファイルは非推奨です。今後は 'lib/supabase/client' から直接インポートしてください。

import { createClient } from '@supabase/supabase-js';

// 環境変数から値を取得
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 環境変数のバリデーション
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase環境変数が設定されていません。' +
    'NEXT_PUBLIC_SUPABASE_URLとNEXT_PUBLIC_SUPABASE_ANON_KEYを設定してください。'
  );
}

// クライアント用Supabaseクライアント
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // セッションをlocalStorageに保存
    autoRefreshToken: true, // トークンの自動リフレッシュを有効化
    detectSessionInUrl: true, // URLからセッション情報を検出
  }
});

export default supabase;
