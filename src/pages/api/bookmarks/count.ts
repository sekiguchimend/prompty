import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GETリクエスト以外は許可しない
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { promptId } = req.query;
    
    if (!promptId) {
      return res.status(400).json({ error: 'promptIdは必須です' });
    }
    
    // Supabaseクライアントの初期化（サービスロールキーを使用）
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
    
    // ブックマーク数を取得
    const { count, error } = await supabase
      .from('bookmarks')
      .select('id', { count: 'exact' })
      .eq('prompt_id', promptId);
    
    if (error) throw error;
    
    return res.status(200).json({ 
      count: count || 0 
    });
    
  } catch (err) {
    console.error('🔴 ブックマーク数取得エラー:', err);
    return res.status(500).json({ 
      error: 'ブックマーク数取得中にエラーが発生しました',
      message: err instanceof Error ? err.message : 'Unknown error',
      count: 0
    });
  }
} 