import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

// JWT生成のためのライブラリ
import { create, getNumericDate } from 'https://deno.land/x/djwt@v3.0.1/mod.ts';

// 環境変数を取得する関数
const getEnv = (key: string): string => {
  return Deno.env.get(key) || '';
};

// JWTを生成してOAuth2トークンを取得する関数
async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: getEnv('FIREBASE_CLIENT_EMAIL'),
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    exp: getNumericDate(60 * 60), // 1時間後に期限切れ
    iat: getNumericDate(0),
  };

  // プライベートキーの処理
  const privateKeyRaw = getEnv('FIREBASE_PRIVATE_KEY');
  
  // 改行文字を正規化
  let privateKeyPem = privateKeyRaw.replace(/\\n/g, '\n');
  
  // ヘッダー・フッターを除去してBase64部分のみ抽出
  privateKeyPem = privateKeyPem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '')
    .replace(/\n/g, '');

  console.log('Private Key Debug:', {
    originalLength: privateKeyRaw.length,
    processedLength: privateKeyPem.length,
    startsWithMII: privateKeyPem.startsWith('MII')
  });

  // PEM形式のプライベートキーをCryptoKeyに変換
  const privateKeyBuffer = Uint8Array.from(atob(privateKeyPem), c => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    privateKeyBuffer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  // JWTを生成
  const jwt = await create({ alg: 'RS256', typ: 'JWT' }, payload, cryptoKey);

  // OAuth2トークンリクエスト
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    throw new Error(`OAuth2 token request failed: ${errorText}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

// FCM通知を送信する関数
async function sendFCMNotification(token: string, notification: any, data?: any) {
  const accessToken = await getAccessToken();
  const projectId = getEnv('FIREBASE_PROJECT_ID');

  const message = {
    message: {
      token: token,
      notification: notification,
      data: data || {},
    },
  };

  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('FCM送信エラー:', errorText);
    throw new Error(`FCM送信失敗: ${errorText}`);
  }

  return await response.json();
}

Deno.serve(async (req: Request) => {
  try {
    // CORSヘッダーを設定
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };

    // OPTIONSリクエストの場合
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    // POSTリクエストのみ受け付け
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405,
        headers: corsHeaders
      });
    }

    console.log('通知キュー処理開始');
    
    // Supabaseクライアントの初期化
    const supabase = createClient(
      getEnv('SUPABASE_URL'),
      getEnv('SUPABASE_SERVICE_ROLE_KEY')
    );

    // 未処理の通知を取得
    const { data: queueItems, error: queueError } = await supabase
      .from('notification_queue')
      .select('*')
      .eq('processed', false)
      .order('created_at', { ascending: true })
      .limit(10); // 一度に10件まで処理

    if (queueError) {
      throw new Error(`キュー取得エラー: ${queueError.message}`);
    }

    console.log(`処理対象の通知: ${queueItems?.length || 0}件`);

    if (!queueItems || queueItems.length === 0) {
      return new Response(JSON.stringify({ message: '処理対象の通知はありません' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let processedCount = 0;
    let errorCount = 0;

    for (const item of queueItems) {
      try {
        const { table_name, record_data } = item;
        console.log(`処理中: ${table_name}`);

        let notifications: any[] = [];

        switch (table_name) {
          case 'comments':
            // コメント通知: 投稿者に通知
            const { data: prompt } = await supabase
              .from('prompts')
              .select('author_id, title')
              .eq('id', record_data.prompt_id)
              .single();

            if (prompt && prompt.author_id !== record_data.user_id) {
              notifications.push({
                recipient_id: prompt.author_id,
                title: '新しいコメント',
                body: `「${prompt.title}」にコメントが投稿されました`,
                data: {
                  type: 'comment',
                  prompt_id: record_data.prompt_id,
                  comment_id: record_data.id
                }
              });
            }
            break;

          case 'likes':
            // いいね通知: 投稿者に通知
            const { data: likedPrompt } = await supabase
              .from('prompts')
              .select('author_id, title')
              .eq('id', record_data.prompt_id)
              .single();

            if (likedPrompt && likedPrompt.author_id !== record_data.user_id) {
              notifications.push({
                recipient_id: likedPrompt.author_id,
                title: 'いいね！',
                body: `「${likedPrompt.title}」にいいねが付きました`,
                data: {
                  type: 'like',
                  prompt_id: record_data.prompt_id,
                  like_id: record_data.id
                }
              });
            }
            break;

          case 'follows':
            // フォロー通知
            const { data: followerProfile } = await supabase
              .from('profiles')
              .select('display_name, username')
              .eq('id', record_data.follower_id)
              .single();

            if (followerProfile) {
              const followerName = followerProfile.display_name || followerProfile.username;
              notifications.push({
                recipient_id: record_data.following_id,
                title: '新しいフォロワー',
                body: `${followerName}さんにフォローされました`,
                data: {
                  type: 'follow',
                  follower_id: record_data.follower_id
                }
              });
            }
            break;

          case 'announcements':
            // お知らせ通知: 全ユーザーに送信
            const { data: allUsers } = await supabase
              .from('profiles')
              .select('id')
              .limit(1000);

            if (allUsers) {
              for (const user of allUsers) {
                notifications.push({
                  recipient_id: user.id,
                  title: record_data.title,
                  body: record_data.content,
                  data: {
                    type: 'announcement',
                    announcement_id: record_data.id
                  }
                });
              }
            }
            break;
        }

        // 各通知を送信
        for (const notification of notifications) {
          try {
            // FCMトークンを取得
            const { data: tokens } = await supabase
              .from('fcm_tokens')
              .select('token')
              .eq('user_id', notification.recipient_id)
              .eq('is_active', true);

            if (tokens && tokens.length > 0) {
              // 各トークンに通知を送信
              for (const tokenRecord of tokens) {
                try {
                  await sendFCMNotification(
                    tokenRecord.token,
                    {
                      title: notification.title,
                      body: notification.body
                    },
                    notification.data
                  );
                  console.log(`通知送信成功: ${notification.recipient_id}`);
                } catch (error) {
                  console.error(`通知送信失敗: ${(error as Error).message}`);
                  
                  // 無効なトークンの場合は無効化
                  if ((error as Error).message.includes('UNREGISTERED') || (error as Error).message.includes('INVALID_ARGUMENT')) {
                    await supabase
                      .from('fcm_tokens')
                      .update({ is_active: false })
                      .eq('token', tokenRecord.token);
                  }
                }
              }
            }
          } catch (error) {
            console.error(`通知処理エラー:`, error);
          }
        }

        // キューアイテムを処理済みにマーク
        await supabase
          .from('notification_queue')
          .update({ 
            processed: true, 
            processed_at: new Date().toISOString() 
          })
          .eq('id', item.id);

        processedCount++;
        console.log(`処理完了: ${item.id}`);

      } catch (error) {
        console.error(`キューアイテム処理エラー: ${item.id}`, error);
        
        // エラーをキューに記録
        await supabase
          .from('notification_queue')
          .update({ 
            error_message: (error as Error).message,
            processed: true, // エラーでも処理済みにして再試行ループを防ぐ
            processed_at: new Date().toISOString()
          })
          .eq('id', item.id);
        
        errorCount++;
      }
    }

    return new Response(JSON.stringify({ 
      message: 'キュー処理完了',
      processedCount,
      errorCount,
      totalItems: queueItems.length
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('キュー処理エラー:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }), 
      { 
        status: 500,
        headers: { 
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        }
      }
    );
  }
}); 