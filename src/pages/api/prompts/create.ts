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
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // POSTリクエスト以外は許可しない
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📥 create-prompt API リクエスト受信:', JSON.stringify(req.body, null, 2));
    const promptData: CreatePromptRequest = req.body;
    
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
    
    // デモ環境では匿名キーを使用
    console.log('🔑 認証情報:', { 
      url: supabaseUrl.substring(0, 20) + '...',
      keyLength: supabaseAnonKey.length,
      serviceKeyAvailable: !!supabaseServiceKey
    });
    
    // サーバーサイドではサービスロールキーを使用（RLS回避のため）
    const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);
    
    // クライアント接続テスト
    try {
      console.log('🔍 Supabase接続テスト開始...');
      const { data: testData, error: testError } = await supabase.from('profiles').select('id').limit(1);
      
      if (testError) {
        console.error('❌ Supabase接続テストエラー:', testError);
      } else {
        console.log('✅ Supabase接続テスト成功:', testData);
      }
    } catch (testErr) {
      console.error('❌ Supabase接続テスト例外:', testErr);
    }
    
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
      published: promptData.published !== undefined ? promptData.published : true
    };
    
    console.log('🔄 挿入データ:', JSON.stringify({
      author_id: insertData.author_id,
      title: insertData.title,
      description: insertData.description,
      content: insertData.content.substring(0, 50) + '...',
      thumbnail_url: insertData.thumbnail_url,
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
      
      return res.status(201).json({
        success: true,
        message: 'プロンプトが正常に保存されました',
        data: data?.[0] || null,
        promptId: data?.[0]?.id || null
      });
    } catch (dbError) {
      console.error('❌ データベース例外:', dbError);
      return res.status(500).json({
        success: false,
        error: 'データベース操作中に例外が発生しました',
        message: dbError instanceof Error ? dbError.message : String(dbError)
      });
    }
    
  } catch (err) {
    console.error('🔴 サーバーエラー:', err);
    
    // エラーオブジェクトの安全な変換
    const errorMessage = err instanceof Error ? err.message : String(err);
    const errorName = err instanceof Error ? err.name : 'UnknownError';
    
    return res.status(500).json({ 
      success: false,
      error: '予期しないエラーが発生しました',
      message: errorMessage,
      name: errorName
    });
  }
} 