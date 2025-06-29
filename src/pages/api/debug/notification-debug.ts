import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin as supabase } from '../../../lib/supabaseAdminClient';

interface DebugResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DebugResponse>
) {
  // CORSヘッダーを設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const debugInfo: any = {};

    // 1. FCMトークンの状態確認
    console.log('🔍 FCMトークンの状態を確認中...');
    const { data: fcmTokens, error: fcmError } = await supabase
      .from('fcm_tokens')
      .select('*')
      .eq('is_active', true);

    debugInfo.fcmTokens = {
      total: fcmTokens?.length || 0,
      tokens: fcmTokens?.map((token: any) => ({
        user_id: token.user_id,
        token_preview: token.token.substring(0, 20) + '...',
        device_info: token.device_info,
        created_at: token.created_at,
        is_active: token.is_active
      })) || [],
      error: fcmError?.message || null
    };

    // 2. 最近のフォロー・いいねの確認
    console.log('🔍 最近のアクティビティを確認中...');
    const { data: recentFollows, error: followsError } = await supabase
      .from('follows')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: recentLikes, error: likesError } = await supabase
      .from('likes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    debugInfo.recentActivity = {
      follows: {
        count: recentFollows?.length || 0,
        recent: recentFollows || [],
        error: followsError?.message || null
      },
      likes: {
        count: recentLikes?.length || 0,
        recent: recentLikes || [],
        error: likesError?.message || null
      }
    };

    // 3. トリガーの存在確認
    console.log('🔍 データベーストリガーを確認中...');
    const { data: triggers, error: triggersError } = await supabase.rpc('get_notification_triggers', {});

    debugInfo.triggers = {
      data: triggers || [],
      error: triggersError?.message || null
    };

    // 4. 通知キューの状態確認
    console.log('🔍 通知キューの状態を確認中...');
    const { data: queueItems, error: queueError } = await supabase
      .from('notification_queue')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    debugInfo.notificationQueue = {
      total: queueItems?.length || 0,
      unprocessed: queueItems?.filter((item: any) => !item.processed).length || 0,
      recent: queueItems || [],
      error: queueError?.message || null
    };

    // 5. Edge Functions の存在確認（URLチェック）
    console.log('🔍 Edge Functions の確認中...');
    debugInfo.edgeFunctions = {};

    // auto-notification Edge Function をテスト
    try {
      const testResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/auto-notification`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          table: 'test',
          record: { test: true }
        })
      });

      debugInfo.edgeFunctions.autoNotification = {
        status: testResponse.status,
        accessible: testResponse.status !== 404,
        error: testResponse.status >= 400 ? await testResponse.text() : null
      };
    } catch (error: any) {
      debugInfo.edgeFunctions.autoNotification = {
        status: 'error',
        accessible: false,
        error: error.message
      };
    }

    // 6. Firebase 環境変数の確認
    console.log('🔍 Firebase設定を確認中...');
    debugInfo.firebaseConfig = {
      hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
      hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      hasVapidKey: !!process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      vapidKeyPreview: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.substring(0, 10) + '...'
    };

    // 7. 手動テスト通知の送信（POSTの場合）
    if (req.method === 'POST' && req.body?.testNotification && fcmTokens && fcmTokens.length > 0) {
      console.log('🔔 テスト通知を送信中...');
      
      try {
        const testResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-notification`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: fcmTokens[0].user_id,
            title: 'デバッグテスト通知',
            body: 'このテスト通知が届いた場合、FCM送信は正常に動作しています'
          })
        });

        const testResult = await testResponse.text();
        debugInfo.testNotification = {
          status: testResponse.status,
          response: testResult,
          sent: testResponse.ok
        };
      } catch (error: any) {
        debugInfo.testNotification = {
          status: 'error',
          error: error.message,
          sent: false
        };
      }
    }

    return res.status(200).json({
      success: true,
      data: debugInfo
    });

  } catch (error: any) {
    console.error('通知デバッグエラー:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'サーバーエラーが発生しました'
    });
  }
} 