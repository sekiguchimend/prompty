import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

// リクエストボディの型定義
interface CreatePromptRequest {
  author_id: string;
  title: string; // プロジェクトタイトル
  description?: string;
  content: string; // プロジェクト説明
  prompt_title: string; // プロンプトタイトル
  prompt_content: string; // プロンプト内容
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
        error: 'プロジェクトタイトルは必須です',
        code: 'missing_title'
      });
    }
    
    if (!promptData.content) {
      return res.status(400).json({ 
        error: 'プロジェクト説明は必須です',
        code: 'missing_content' 
      });
    }
    
    if (!promptData.prompt_title) {
      return res.status(400).json({ 
        error: 'プロンプトタイトルは必須です',
        code: 'missing_prompt_title'
      });
    }
    
    if (!promptData.prompt_content) {
      return res.status(400).json({ 
        error: 'プロンプト内容は必須です',
        code: 'missing_prompt_content'
      });
    }
    
    // データモデルに従ったバリデーション
    if (promptData.prompt_title.length < 5) {
      return res.status(400).json({ 
        error: 'プロンプトタイトルは5文字以上である必要があります',
        code: 'title_length'
      });
    }
    
    if (promptData.prompt_content.length < 10) {
      return res.status(400).json({ 
        error: 'プロンプト内容は10文字以上である必要があります',
        code: 'content_length'
      });
    }
    
    
    // Supabaseクライアントの初期化
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({ 
        error: 'サーバー設定エラー',
        code: 'missing_env_vars'
      });
    }
    
    
    // Supabaseクライアントの作成
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // クライアント接続テスト
    try {
      const { data: testData, error: testError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      if (testError) {
        return res.status(500).json({
          error: 'データベース接続エラー',
          code: testError.code,
          message: testError.message
        });
      }
    } catch (testErr) {
      return res.status(500).json({
        error: 'データベース接続中に例外が発生しました',
        message: testErr instanceof Error ? testErr.message : 'Unknown error'
      });
    }
    
    // データの準備
    const insertData = {
      author_id: promptData.author_id,
      title: promptData.title, // プロジェクトタイトル
      description: promptData.description || '',
      content: promptData.content, // プロジェクト説明
      prompt_title: promptData.prompt_title, // プロンプトタイトル
      prompt_content: promptData.prompt_content, // プロンプト内容
      thumbnail_url: promptData.thumbnail_url || null,
      category_id: promptData.category_id || null,
      price: promptData.price || 0,
      is_free: promptData.is_free !== undefined ? promptData.is_free : true,
      is_premium: promptData.is_premium !== undefined ? promptData.is_premium : false,
      is_ai_generated: promptData.is_ai_generated !== undefined ? promptData.is_ai_generated : false,
      is_featured: promptData.is_featured !== undefined ? promptData.is_featured : false,
      published: promptData.published !== undefined ? promptData.published : true
    };
    
    
    // データ挿入を試行
    const { data, error } = await supabase
      .from('prompts')
      .insert([insertData])
      .select();
    
    if (error) {
      if (error.code === '42501') {
        
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
            error: 'プロンプトタイトルは5文字以上である必要があります',
            code: 'title_length'
          });
        }
        
        if (error.message.includes('content_length')) {
          return res.status(400).json({
            error: 'プロンプト内容は10文字以上である必要があります',
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
    
    
    return res.status(201).json({
      success: true,
      message: 'プロンプトが正常に保存されました',
      data: data?.[0] || null
    });
    
  } catch (err) {
    return res.status(500).json({ 
      error: '予期しないエラーが発生しました',
      message: err instanceof Error ? err.message : 'Unknown error'
    });
  }
}