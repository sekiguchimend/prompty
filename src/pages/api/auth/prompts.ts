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
  // POSTリクエストのみ許可
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📥 POST /api/prompts リクエスト受信:', JSON.stringify(req.body, null, 2));
    const promptData: CreatePromptRequest = req.body;
    
    // 必須フィールドの検証
    if (!promptData.author_id) {
      return res.status(400).json({ 
        error: 'author_idは必須です',
        code: 'missing_author'
      });
    }
    
    if (!promptData.title) {
      return res.status(400).json({ 
        error: 'タイトルは必須です',
        code: 'missing_title'
      });
    }
    
    if (!promptData.content) {
      return res.status(400).json({ 
        error: 'コンテンツは必須です',
        code: 'missing_content' 
      });
    }
    
    // データモデルに従ったバリデーション
    if (promptData.title.length < 5) {
      return res.status(400).json({ 
        error: 'タイトルは5文字以上である必要があります',
        code: 'title_length'
      });
    }
    
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
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ Supabase環境変数が設定されていません');
      return res.status(500).json({ 
        error: 'サーバー設定エラー',
        code: 'missing_env_vars'
      });
    }
    
    // デバッグ情報
    console.log('🔑 接続情報:', { 
      url: supabaseUrl.substring(0, 20) + '...',
      keyLength: supabaseAnonKey.length
    });
    
    // Supabaseクライアントの作成
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // クライアント接続テスト
    try {
      console.log('🔍 Supabase接続テスト開始...');
      const { data: testData, error: testError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      if (testError) {
        console.error('❌ Supabase接続テストエラー:', testError);
        return res.status(500).json({
          error: 'データベース接続エラー',
          code: testError.code,
          message: testError.message
        });
      } else {
        console.log('✅ Supabase接続テスト成功:', testData);
      }
    } catch (testErr) {
      console.error('❌ Supabase接続テスト例外:', testErr);
      return res.status(500).json({
        error: 'データベース接続中に例外が発生しました',
        message: testErr instanceof Error ? testErr.message : 'Unknown error'
      });
    }
    
    // データの準備
    const insertData = {
      author_id: promptData.author_id,
      title: promptData.title,
      description: promptData.description || '',
      content: promptData.content,
      thumbnail_url: promptData.thumbnail_url || null,
      category_id: promptData.category_id || null,
      price: promptData.price || 0,
      is_free: promptData.is_free !== undefined ? promptData.is_free : true,
      is_premium: promptData.is_premium !== undefined ? promptData.is_premium : false,
      is_ai_generated: promptData.is_ai_generated !== undefined ? promptData.is_ai_generated : false,
      is_featured: promptData.is_featured !== undefined ? promptData.is_featured : false,
      published: promptData.published !== undefined ? promptData.published : true
    };
    
    console.log('🔄 挿入データ:', {
      author_id: insertData.author_id,
      title: insertData.title,
      description: insertData.description.substring(0, 20) + '...',
      contentLength: insertData.content.length
    });
    
    // データ挿入を試行
    console.log('🔄 データベースへの挿入を試行中...');
    const { data, error } = await supabase
      .from('prompts')
      .insert([insertData])
      .select();
    
    if (error) {
      console.error('❌ 挿入エラー:', JSON.stringify(error, null, 2));
      
      if (error.code === '42501') {
        console.error('RLSポリシー違反が発生しました:');
        console.error('- author_id:', insertData.author_id);
        
        return res.status(403).json({
          error: '権限がありません',
          code: 'permission_denied',
          message: 'この投稿を行う権限がありません。ログイン状態を確認してください。'
        });
      }
      
      if (error.code === '23514') {
        // チェック制約違反
        if (error.message.includes('title_length')) {
          return res.status(400).json({
            error: 'タイトルは5文字以上である必要があります',
            code: 'title_length'
          });
        }
        
        if (error.message.includes('content_length')) {
          return res.status(400).json({
            error: 'コンテンツは10文字以上である必要があります',
            code: 'content_length'
          });
        }
      }
      
      return res.status(500).json({
        error: 'データベースエラー',
        code: error.code,
        message: error.message
      });
    }
    
    console.log('✅ 挿入成功:', data?.[0]?.id);
    
    return res.status(201).json({
      success: true,
      message: 'プロンプトが正常に保存されました',
      data: data?.[0] || null
    });
    
  } catch (err) {
    console.error('🔴 サーバーエラー:', err);
    return res.status(500).json({ 
      error: '予期しないエラーが発生しました',
      message: err instanceof Error ? err.message : 'Unknown error'
    });
  }
}