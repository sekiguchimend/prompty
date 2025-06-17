import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createPromptSchema } from '../../../lib/security/input-validation';
import { SecureDB } from '../../../lib/security/secure-db';

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
  site_url?: string;
  preview_lines?: number | null;
  ai_model?: string | null; // 使用されたAIモデル
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // POSTリクエスト以外は許可しない
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 🔒 認証チェック（最優先）
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: '認証が必要です',
        code: 'authentication_required' 
      });
    }

    // Supabaseクライアントの初期化
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({
        error: 'サーバー設定エラー',
        code: 'missing_env_vars'
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const secureDB = new SecureDB(supabase);

    // 🔒 認証トークンの検証
    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ 
        error: '無効な認証トークンです',
        code: 'invalid_token' 
      });
    }

    // 🔒 セキュアな入力検証
    const validatedData = createPromptSchema.parse({
      title: req.body.prompt_title || req.body.title,
      description: req.body.description || '',
      content: req.body.prompt_content || req.body.content,
      category_id: req.body.category_id || null,
      is_public: true,
      is_premium: req.body.is_premium || false,
      price: req.body.price || 0
    });

    
    // 🔒 権限昇格防止 - 必ず認証済みユーザーIDを使用
    const safePromptData = {
      ...validatedData,
      thumbnail_url: req.body.thumbnail_url || null,
      site_url: req.body.site_url || null,
      preview_lines: req.body.preview_lines || null,
      ai_model: req.body.ai_model || null // AIモデル情報を保存
    };

    // media_typeはオプショナル（カラムが存在しない場合を考慮）
    // 一時的にコメントアウト
    // if (req.body.media_type) {
    //   safePromptData.media_type = req.body.media_type;
    // }
    
    // 🔒 セキュアなプロンプト作成（権限チェック付き）
    try {
      const result = await secureDB.createPromptWithAuth(safePromptData, user.id);
      
      
      return res.status(200).json({
        success: true,
        promptId: result.data?.id,
        data: result.data
      });
      
    } catch (dbError: any) {
      
      if (dbError.message.includes('権限エラー')) {
        return res.status(403).json({
          error: '権限が不足しています',
          code: 'permission_denied'
        });
      }
      
      return res.status(500).json({
        error: 'データベース処理でエラーが発生しました',
        code: 'database_error'
      });
    }
  } catch (error: any) {
    
    // 🔒 セキュアなエラーレスポンス（内部情報を隠す）
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: '入力データが無効です',
        code: 'validation_error'
      });
    }
    
    return res.status(500).json({
      error: 'サーバーエラーが発生しました',
      code: 'internal_server_error'
    });
  }
} 