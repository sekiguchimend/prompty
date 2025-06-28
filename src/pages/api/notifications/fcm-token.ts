import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase-unified';

interface FCMTokenRequest {
  token: string;
  device_info?: {
    userAgent?: string;
    platform?: string;
    [key: string]: any;
  };
}

interface FCMTokenResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FCMTokenResponse>
) {
  // CORSヘッダーを設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 認証チェック
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: '認証が必要です'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: '認証に失敗しました'
      });
    }

    switch (req.method) {
      case 'POST':
        return await saveFCMToken(req, res, user.id);
      case 'GET':
        return await getFCMTokens(req, res, user.id);
      case 'DELETE':
        return await deleteFCMToken(req, res, user.id);
      default:
        return res.status(405).json({
          success: false,
          error: 'Method not allowed'
        });
    }
  } catch (error) {
    console.error('FCM Token API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'サーバーエラーが発生しました'
    });
  }
}

// FCMトークンを保存
async function saveFCMToken(
  req: NextApiRequest,
  res: NextApiResponse<FCMTokenResponse>,
  userId: string
) {
  const { token, device_info }: FCMTokenRequest = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      error: 'tokenは必須です'
    });
  }

  try {
    // 既存のトークンを確認
    const { data: existingToken } = await supabase
      .from('fcm_tokens')
      .select('id')
      .eq('user_id', userId)
      .eq('token', token)
      .single();

    if (existingToken) {
      // 既存のトークンを更新（device_infoとis_activeを更新）
      const { data, error } = await supabase
        .from('fcm_tokens')
        .update({
          device_info: device_info || {},
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingToken.id)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        data
      });
    } else {
      // 新しいトークンを挿入
      const { data, error } = await supabase
        .from('fcm_tokens')
        .insert({
          user_id: userId,
          token,
          device_info: device_info || {},
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({
        success: true,
        data
      });
    }
  } catch (error: any) {
    console.error('Save FCM Token Error:', error);
    return res.status(500).json({
      success: false,
      error: 'トークンの保存に失敗しました'
    });
  }
}

// ユーザーのFCMトークン一覧を取得
async function getFCMTokens(
  req: NextApiRequest,
  res: NextApiResponse<FCMTokenResponse>,
  userId: string
) {
  try {
    const { data, error } = await supabase
      .from('fcm_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error: any) {
    console.error('Get FCM Tokens Error:', error);
    return res.status(500).json({
      success: false,
      error: 'トークンの取得に失敗しました'
    });
  }
}

// FCMトークンを削除（非アクティブ化）
async function deleteFCMToken(
  req: NextApiRequest,
  res: NextApiResponse<FCMTokenResponse>,
  userId: string
) {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      error: 'tokenは必須です'
    });
  }

  try {
    const { data, error } = await supabase
      .from('fcm_tokens')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('token', token)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error: any) {
    console.error('Delete FCM Token Error:', error);
    return res.status(500).json({
      success: false,
      error: 'トークンの削除に失敗しました'
    });
  }
} 