import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // POSTリクエスト以外は許可しない
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 認証チェック (サービスロールキーなしでは実行不可)
  const apiKey = req.headers['x-api-key'] as string;
  const adminKey = process.env.ADMIN_API_KEY;
  
  if (!adminKey || apiKey !== adminKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Supabaseクライアントの初期化
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    if (!supabaseServiceKey) {
      console.error('❌ サービスロールキーが設定されていません');
      return res.status(500).json({ 
        error: 'サーバー設定エラー',
        message: 'サービスロールキーが設定されていません'
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // SQLファイルを読み込む
    const sqlFilePath = path.join(process.cwd(), 'sql', 'create_user_settings_table.sql');
    
    if (!fs.existsSync(sqlFilePath)) {
      console.error('❌ SQLファイルが見つかりません:', sqlFilePath);
      return res.status(500).json({ 
        error: 'システムエラー',
        message: 'マイグレーションファイルが見つかりません'
      });
    }
    
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // SQLファイルを実行
    const { error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.error('❌ マイグレーション実行エラー:', error);
      return res.status(500).json({ 
        error: 'データベースエラー',
        message: error.message,
        details: error
      });
    }
    
    // 実行結果
    return res.status(200).json({ 
      success: true, 
      message: 'コメントシステムのマイグレーションが完了しました'
    });
    
  } catch (err) {
    console.error('🔴 システムエラー:', err);
    return res.status(500).json({ 
      error: 'システムエラー',
      message: err instanceof Error ? err.message : '予期しないエラーが発生しました'
    });
  }
} 