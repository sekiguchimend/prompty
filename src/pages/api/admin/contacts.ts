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
        return await getContacts(req, res);
      case 'PUT':
        return await updateContact(req, res);
      default:
        return res.status(405).json({ 
          success: false, 
          error: 'メソッドが許可されていません' 
        });
    }
  } catch (error) {
    console.error('お問い合わせAPI エラー:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'サーバーエラーが発生しました' 
    });
  }
}

async function getContacts(req: NextApiRequest, res: NextApiResponse) {
  const { data, error } = await supabase
    .from('contacts')
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

async function updateContact(req: NextApiRequest, res: NextApiResponse) {
  const { id, is_read } = req.body;

  if (!id || is_read === undefined) {
    return res.status(400).json({ 
      success: false, 
      error: 'IDと既読状態が必要です' 
    });
  }

  const { error } = await supabase
    .from('contacts')
    .update({ 
      is_read,
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
    message: 'お問い合わせを更新しました' 
  });
} 