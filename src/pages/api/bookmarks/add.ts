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
    
    // すでにブックマークしているか確認
    const { data: existingBookmark, error: existingError } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('prompt_id', prompt_id)
      .eq('user_id', user_id)
      .single();
    
    if (existingError && existingError.code !== 'PGRST116') {
      throw existingError;
    }
    
    if (existingBookmark) {
      // すでにブックマークしている場合は成功として返す
      return res.status(200).json({ 
        success: true, 
        message: '既にブックマークされています', 
        alreadyBookmarked: true 
      });
    }
    
    // ブックマークをデータベースに追加
    const { error } = await supabase
      .from('bookmarks')
      .insert({ 
        prompt_id: prompt_id, 
        user_id: user_id
      });
    
    if (error) throw error;
    
    return res.status(200).json({ 
      success: true, 
      message: 'ブックマークを追加しました' 
    });
    
  } catch (err) {
    console.error('🔴 ブックマーク追加エラー:', err);
    return res.status(500).json({ 
      error: 'ブックマーク追加中にエラーが発生しました',
      message: err instanceof Error ? err.message : 'Unknown error'
    });
  }
} 