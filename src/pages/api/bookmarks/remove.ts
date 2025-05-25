import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // POSTリクエスト以外は許可しない
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt_id, user_id } = req.body;
    
    if (!prompt_id || !user_id) {
      return res.status(400).json({ error: 'prompt_idとuser_idは必須です' });
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
    
    // ブックマークを削除
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('prompt_id', prompt_id)
      .eq('user_id', user_id);
    
    if (error) throw error;
    
    return res.status(200).json({ 
      success: true, 
      message: 'ブックマークを削除しました' 
    });
    
  } catch (err) {
    console.error('🔴 ブックマーク削除エラー:', err);
    return res.status(500).json({ 
      error: 'ブックマーク削除中にエラーが発生しました',
      message: err instanceof Error ? err.message : 'Unknown error'
    });
  }
} 