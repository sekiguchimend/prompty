import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabaseClient';
import { checkCurrentUserAdmin } from '../../../lib/admin-auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 管理者権限チェック
  const isAdmin = await checkCurrentUserAdmin();
  if (!isAdmin) {
    return res.status(403).json({ 
      success: false, 
      error: '管理者権限が必要です' 
    });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getAnnouncements(req, res);
      case 'POST':
        return await createAnnouncement(req, res);
      case 'PUT':
        return await updateAnnouncement(req, res);
      default:
        return res.status(405).json({ 
          success: false, 
          error: 'メソッドが許可されていません' 
        });
    }
  } catch (error) {
    console.error('お知らせAPI エラー:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'サーバーエラーが発生しました' 
    });
  }
}

async function getAnnouncements(req: NextApiRequest, res: NextApiResponse) {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }

  return res.status(200).json({ 
    success: true, 
    data: data || [] 
  });
}

async function createAnnouncement(req: NextApiRequest, res: NextApiResponse) {
  const { title, content, icon, icon_color, start_date, end_date, is_active } = req.body;

  if (!title || !content) {
    return res.status(400).json({ 
      success: false, 
      error: 'タイトルと内容は必須です' 
    });
  }

  const { error } = await supabase
    .from('announcements')
    .insert({
      title,
      content,
      icon: icon || 'info',
      icon_color: icon_color || 'blue',
      start_date: start_date ? new Date(start_date).toISOString() : new Date().toISOString(),
      end_date: end_date ? new Date(end_date).toISOString() : null,
      is_active: is_active || true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

  if (error) {
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }

  return res.status(201).json({ 
    success: true, 
    message: 'お知らせを作成しました' 
  });
}

async function updateAnnouncement(req: NextApiRequest, res: NextApiResponse) {
  const { id, is_active } = req.body;

  if (!id || is_active === undefined) {
    return res.status(400).json({ 
      success: false, 
      error: 'IDとアクティブ状態が必要です' 
    });
  }

  const { error } = await supabase
    .from('announcements')
    .update({ 
      is_active,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }

  return res.status(200).json({ 
    success: true, 
    message: 'お知らせを更新しました' 
  });
} 