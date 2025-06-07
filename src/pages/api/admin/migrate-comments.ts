import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';
import { adminRateLimit } from '../../../lib/security/rate-limiter-enhanced';

async function migrateCommentsHandler(req: NextApiRequest, res: NextApiResponse) {
  // POSTリクエスト以外は許可しない
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 🔒 多層認証チェック
  const apiKey = req.headers['x-api-key'] as string;
  const authHeader = req.headers.authorization;
  const adminKey = process.env.ADMIN_API_KEY;
  
  // API キーチェック
  if (!adminKey || apiKey !== adminKey) {
    console.warn('🚨 管理者API不正アクセス試行:', {
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 認証トークンチェック
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication token required' });
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
    
    // 🔒 管理者権限の最終確認
    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    // 管理者ロールチェック
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.is_admin) {
      console.warn('🚨 非管理者による管理者API実行試行:', {
        userId: user.id,
        email: user.email
      });
      return res.status(403).json({ error: 'Admin privileges required' });
    }
    
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
      message: '管理者操作の実行中にエラーが発生しました'
    });
  }
}

// 🔒 レート制限付きエクスポート
export default adminRateLimit(migrateCommentsHandler); 