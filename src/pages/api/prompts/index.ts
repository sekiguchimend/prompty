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
  // メソッドに応じた処理
  switch (req.method) {
    case 'POST':
      return await createPrompt(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// POST: プロンプト作成
async function createPrompt(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('📥 POST /api/prompts リクエスト受信:', JSON.stringify(req.body, null, 2));
    const promptData: CreatePromptRequest = req.body;
    
    // 必須フィールドの検証
    if (!promptData.author_id) {
      return res.status(400).json({ error: 'author_idは必須です' });
    }
    
    if (!promptData.title) {
      return res.status(400).json({ error: 'プロジェクトタイトルは必須です' });
    }
    
    if (!promptData.content) {
      return res.status(400).json({ error: 'プロジェクト説明は必須です' });
    }
    
    if (!promptData.prompt_title) {
      return res.status(400).json({ error: 'プロンプトタイトルは必須です' });
    }
    
    if (!promptData.prompt_content) {
      return res.status(400).json({ error: 'プロンプト内容は必須です' });
    }
    
    // タイトルの長さチェック
    if (promptData.prompt_title.length < 5) {
      return res.status(400).json({ 
        error: 'プロンプトタイトルは5文字以上である必要があります',
        code: 'title_length'
      });
    }
    
    // コンテンツの長さチェック
    if (promptData.prompt_content.length < 10) {
      return res.status(400).json({ 
        error: 'プロンプト内容は10文字以上である必要があります',
        code: 'content_length'
      });
    }
    
    console.log('✅ バリデーション通過');
    
    // Supabaseクライアントの初期化
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    // デバッグ情報
    console.log('🔑 Supabase URL:', supabaseUrl);
    console.log('🔑 API Key 長さ:', supabaseAnonKey.length);
    console.log('🔑 Service Role Key 長さ:', serviceRoleKey.length);
    
    // APIキーの有効性を確認
    if (!supabaseUrl || supabaseUrl === '' || !serviceRoleKey || serviceRoleKey === '') {
      console.error('❌ Supabase URLまたはService Role Keyが設定されていません');
      return res.status(500).json({
        error: 'サーバー設定エラー',
        code: 'invalid_api_key',
        message: 'Supabase接続情報が正しく設定されていません。管理者にお問い合わせください。'
      });
    }
    
    // 匿名投稿を可能にするためにサービスロールキーを使用
    const options = {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    };
    
    // サービスロールキーが有効な場合はそれを使用し、RLSポリシーをバイパス
    let supabaseClient;
    try {
      if (serviceRoleKey.length > 20) {
        console.log('✅ サービスロールキーを使用します');
        supabaseClient = createClient(supabaseUrl, serviceRoleKey, {
          ...options,
          global: {
            headers: { 'x-supabase-role': 'service_role' }
          }
        });
      } else {
        console.log('⚠️ 匿名キーを使用します (RLSポリシーが適用されます)');
        supabaseClient = createClient(supabaseUrl, supabaseAnonKey, options);
      }
    } catch (clientError) {
      console.error('❌ Supabaseクライアント作成エラー:', clientError);
      return res.status(500).json({
        error: 'API接続エラー',
        code: 'client_creation_error',
        message: 'Supabaseクライアントの作成に失敗しました。'
      });
    }
    
    const supabase = supabaseClient;
    
    // これ以降のエラーが発生した場合のため、変数をクリアなスコープで定義
    let testData, testError;
    
    // クライアント接続テスト
    try {
      console.log('🔍 Supabase接続テスト開始...');
      const { data, error } = await supabase.from('profiles').select('id').limit(1);
      
      testData = data;
      testError = error;
      
      if (error) {
        console.error('❌ Supabase接続テストエラー:', error);
        
        // API接続に問題がある場合は早期リターン
        if (error.message === 'Invalid API key') {
          return res.status(500).json({
            error: 'API キーが無効です',
            code: 'invalid_api_key',
            message: 'Supabase API キーが正しく設定されていないか、無効になっています。'
          });
        }
        
        if (error.code === 'PGRST301') {
          return res.status(500).json({
            error: 'データベース接続エラー',
            code: 'db_connection_error',
            message: 'データベースに接続できませんでした。'
          });
        }
        
        return res.status(500).json({
          error: 'Supabase接続エラー',
          code: 'supabase_connection_error',
          message: error.message,
          details: error
        });
      } else {
        console.log('✅ Supabase接続テスト成功:', data);
      }
    } catch (testErr) {
      console.error('❌ Supabase接続テスト例外:', testErr);
      return res.status(500).json({
        error: 'サーバー内部エラー',
        code: 'internal_server_error',
        message: testErr instanceof Error ? testErr.message : '不明なエラーが発生しました'
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
      category_id: promptData.category_id === 'none' ? null : promptData.category_id || null,
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
      contentLength: insertData.content.length,
      prompt_title: insertData.prompt_title,
      prompt_content: insertData.prompt_content.substring(0, 20) + '...'
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