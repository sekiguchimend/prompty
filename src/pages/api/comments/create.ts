import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { prompt_id, user_id, content, parent_id } = req.body;

  // バリデーション
  if (!prompt_id || !user_id || !content || content.length < 1) {
    return res.status(400).json({ success: false, message: '必須項目が不足しています' });
  }

  // コメントを挿入
  const { data, error } = await supabase
    .from('comments')
    .insert([
      {
        prompt_id,
        user_id,
        content,
        parent_id: parent_id || null,
        is_edited: false,
      }
    ])
    .select('id, created_at');

  if (error) {
    return res.status(500).json({ success: false, message: 'コメント保存に失敗しました', error: error.message });
  }

  return res.status(201).json({ success: true, message: 'コメントを保存しました', data: data[0] });
} 