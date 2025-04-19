import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

// リクエストボディの型定義
interface CreatePromptRequest {
  author_id: string;
  title: string;
  description?: string;
  content: string;
  thumbnail_url?: string | null;
  category_id?: string | null;
  price?: number;
  is_free?: boolean;
  is_premium?: boolean;
  is_ai_generated?: boolean;
  is_featured?: boolean;
  published?: boolean;
  site_url?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // POSTリクエスト以外は許可しない
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📥 create-prompt API リクエスト受信:', JSON.stringify(req.body, null, 2));
    const promptData: CreatePromptRequest = req.body;
    
    // サムネイルURLの受信を詳細にログ出力
    console.log('📸 受信したthumbnail_url:', promptData.thumbnail_url);
    console.log('📸 thumbnail_urlの型:', typeof promptData.thumbnail_url);
    if (promptData.thumbnail_url) {
      console.log('📸 thumbnail_urlの長さ:', promptData.thumbnail_url.length);
      console.log('📸 thumbnail_urlの部分表示:', promptData.thumbnail_url.substring(0, 100) + '...');
    }
    
    // 必須フィールドの検証
    if (!promptData.author_id) {
      return res.status(400).json({ error: 'author_idは必須です' });
    }
    
    if (!promptData.title) {
      return res.status(400).json({ error: 'タイトルは必須です' });
    }
    
    if (!promptData.content) {
      return res.status(400).json({ error: 'コンテンツは必須です' });
    }
    
    // タイトルの長さチェック
    if (promptData.title.length < 5) {
      return res.status(400).json({ 
        error: 'タイトルは5文字以上である必要があります',
        code: 'title_length'
      });
    }
    
    // コンテンツの長さチェック
    if (promptData.content.length < 10) {
      return res.status(400).json({ 
        error: 'コンテンツは10文字以上である必要があります',
        code: 'content_length'
      });
    }
    
    console.log('✅ バリデーション通過');
    
    // Supabaseクライアントの初期化
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    // 環境変数のデバッグログ
    console.log('🔑 Supabase URL:', supabaseUrl);
    console.log('🔑 Anon Key 長さ:', supabaseAnonKey.length);
    console.log('🔑 Service Role Key 長さ:', supabaseServiceKey.length);
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Supabase環境変数が設定されていません');
      return res.status(500).json({
        success: false,
        error: 'サーバー設定エラー',
        code: 'missing_env_vars'
      });
    }
    
    // サービスロールキーを使用してクライアントを初期化
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // データの準備
    const insertData = {
      author_id: promptData.author_id,
      title: promptData.title,
      description: promptData.description || '',
      content: promptData.content,
      thumbnail_url: promptData.thumbnail_url || null,
      category_id: promptData.category_id === 'none' ? null : promptData.category_id || null,
      price: promptData.price || 0,
      is_free: promptData.is_free !== undefined ? promptData.is_free : true,
      is_premium: promptData.is_premium !== undefined ? promptData.is_premium : false,
      is_ai_generated: promptData.is_ai_generated !== undefined ? promptData.is_ai_generated : false,
      is_featured: promptData.is_featured !== undefined ? promptData.is_featured : false,
      published: promptData.published !== undefined ? promptData.published : true,
      site_url: promptData.site_url || null
    };
    
    console.log('🔄 挿入データ:', JSON.stringify({
      author_id: insertData.author_id,
      title: insertData.title,
      description: insertData.description,
      content: insertData.content.substring(0, 50) + '...',
      thumbnail_url: insertData.thumbnail_url ? '存在します(URLの長さ:' + insertData.thumbnail_url.length + ')' : 'null',
      is_free: insertData.is_free
    }, null, 2));
    
    // データ挿入を試行
    console.log('🔄 データベースへの挿入を試行中...');
    try {
      const { data, error } = await supabase
        .from('prompts')
        .insert([insertData])
        .select();
      
      if (error) {
        console.error('❌ 挿入エラー:', JSON.stringify(error, null, 2));
        
        if (error.code === '42501') {
          return res.status(403).json({
            success: false,
            error: '権限がありません (RLSポリシー違反)',
            code: 'permission_denied',
            message: 'ユーザーに必要な権限がないか、サービスロールキーが正しく設定されていません'
          });
        }
        
        // API キーエラーの特別処理
        if (error.message === 'Invalid API key') {
          return res.status(500).json({
            success: false,
            error: 'API キーが無効です',
            code: 'invalid_api_key',
            message: 'Supabase API キーが正しく設定されていないか、無効になっています。'
          });
        }
        
        return res.status(500).json({
          success: false,
          error: 'データベースエラー',
          code: error.code,
          message: error.message
        });
      }
      
      console.log('✅ 挿入成功:', data?.[0]?.id);
      console.log('返却データ:', JSON.stringify(data?.[0] || {}, null, 2));
      
      return res.status(200).json({
        success: true,
        promptId: data?.[0]?.id,
        data: data?.[0]
      });
    } catch (dbError: any) {
      console.error('❌ データベース例外:', dbError);
      return res.status(500).json({
        success: false,
        error: 'データベース処理中に例外が発生しました',
        message: dbError.message
      });
    }
  } catch (error: any) {
    console.error('❌ 予期せぬエラー:', error);
    return res.status(500).json({
      success: false,
      error: '予期せぬエラーが発生しました',
      message: error.message
    });
  }
} 