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

    const { title, body, userId } = await req.json();
    
    console.log('手動通知送信開始:', { title, body, userId });
    
    // Supabaseクライアントの初期化
    const supabase = createClient(
      getEnv('SUPABASE_URL'),
      getEnv('SUPABASE_SERVICE_ROLE_KEY')
    );

    // ユーザーのFCMトークンを取得
    const { data: tokens, error } = await supabase
      .from('fcm_tokens')
      .select('token')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      console.error('FCMトークン取得エラー:', error);
      return new Response(
        JSON.stringify({ error: 'FCMトークンの取得に失敗しました' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!tokens || tokens.length === 0) {
      console.log('ユーザーのFCMトークンが見つかりません');
      return new Response(
        JSON.stringify({ error: 'FCMトークンが登録されていません' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const results = [];
    
    // 各トークンに通知を送信
    for (const tokenRecord of tokens) {
      try {
        const result = await sendFCMNotification(
          tokenRecord.token,
          {
            title: title,
            body: body
          },
          {
            type: 'test',
            timestamp: new Date().toISOString()
          }
        );
        
        results.push({ 
          token: tokenRecord.token.substring(0, 10) + '...', 
          status: 'success',
          result 
        });
        
        console.log(`通知送信成功: ${tokenRecord.token.substring(0, 10)}...`);
      } catch (error) {
        console.error(`通知送信失敗: ${(error as Error).message}`);
        
        results.push({ 
          token: tokenRecord.token.substring(0, 10) + '...', 
          status: 'error',
          error: (error as Error).message 
        });
        
        // 無効なトークンの場合は非アクティブにする
        if ((error as Error).message.includes('UNREGISTERED') || (error as Error).message.includes('INVALID_ARGUMENT')) {
          await supabase
            .from('fcm_tokens')
            .update({ is_active: false })
            .eq('token', tokenRecord.token);
          
          console.log(`無効なトークンを非アクティブにしました: ${tokenRecord.token.substring(0, 10)}...`);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        message: '通知送信が完了しました',
        results: results,
        total: tokens.length,
        successful: results.filter(r => r.status === 'success').length
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('手動通知エラー:', error);
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