import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabaseClient';
import { supabaseAdmin } from '../../../lib/supabaseAdminClient';

// プロンプト更新リクエストの型定義
interface UpdatePromptRequest {
  title?: string;
  description?: string;
  content?: string;
  prompt_title?: string;
  prompt_content?: string;
  thumbnail_url?: string;
  category_id?: string;
  published?: boolean;
  price?: number;
  is_free?: boolean;
  ai_model?: string;
  site_url?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ 
      success: false, 
      error: 'プロンプトIDが必要です' 
    });
  }

  // メソッドに応じた処理
  switch (req.method) {
    case 'PUT':
      return await updatePrompt(req, res, id);
    case 'DELETE':
      return await deletePrompt(req, res, id);
    default:
      return res.status(405).json({ 
        success: false, 
        error: 'メソッドが許可されていません' 
      });
  }
}

// プロンプト更新（非公開化含む）
async function updatePrompt(
  req: NextApiRequest,
  res: NextApiResponse,
  promptId: string
) {
  try {
    // 認証トークンを取得
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ 
        success: false, 
        error: 'ログインが必要です' 
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: '有効な認証トークンが必要です' 
      });
    }

    // ユーザー認証を確認
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ 
        success: false, 
        error: '認証に失敗しました' 
      });
    }

    const updateData: UpdatePromptRequest = req.body;

    // まず、プロンプトの存在と所有者チェック
    const { data: existingPrompt, error: fetchError } = await supabase
      .from('prompts')
      .select('id, author_id, title')
      .eq('id', promptId)
      .single();

    if (fetchError || !existingPrompt) {
      return res.status(404).json({ 
        success: false, 
        error: 'プロンプトが見つかりません' 
      });
    }

    // 所有者チェック
    if (existingPrompt.author_id !== user.id) {
      return res.status(403).json({ 
        success: false, 
        error: '他のユーザーのプロンプトを編集する権限がありません' 
      });
    }

    // 更新データの準備
    const updateFields: any = {
      updated_at: new Date().toISOString(),
    };

    // フィールドの更新（undefined でない場合のみ）
    if (updateData.title !== undefined) {
      if (updateData.title.length < 5) {
        return res.status(400).json({ 
          success: false, 
          error: 'タイトルは5文字以上である必要があります' 
        });
      }
      updateFields.title = updateData.title.trim();
    }

    if (updateData.description !== undefined) {
      updateFields.description = updateData.description.trim();
    }

    if (updateData.content !== undefined) {
      if (updateData.content.length < 10) {
        return res.status(400).json({ 
          success: false, 
          error: 'コンテンツは10文字以上である必要があります' 
        });
      }
      updateFields.content = updateData.content.trim();
    }

    if (updateData.prompt_title !== undefined) {
      updateFields.prompt_title = updateData.prompt_title.trim();
    }

    if (updateData.prompt_content !== undefined) {
      updateFields.prompt_content = updateData.prompt_content.trim();
    }

    if (updateData.thumbnail_url !== undefined) {
      updateFields.thumbnail_url = updateData.thumbnail_url;
    }

    if (updateData.category_id !== undefined) {
      updateFields.category_id = updateData.category_id === 'none' ? null : updateData.category_id;
    }

    if (updateData.published !== undefined) {
      updateFields.published = updateData.published;
    }

    if (updateData.price !== undefined) {
      updateFields.price = updateData.price;
    }

    if (updateData.is_free !== undefined) {
      updateFields.is_free = updateData.is_free;
    }

    if (updateData.ai_model !== undefined) {
      updateFields.ai_model = updateData.ai_model;
    }

    if (updateData.site_url !== undefined) {
      updateFields.site_url = updateData.site_url;
    }

    // データベース更新
    const { data: updatedPrompt, error: updateError } = await supabase
      .from('prompts')
      .update(updateFields)
      .eq('id', promptId)
      .eq('author_id', user.id) // 追加のセキュリティチェック
      .select()
      .single();

    if (updateError) {
      console.error('プロンプト更新エラー:', updateError);
      return res.status(500).json({ 
        success: false, 
        error: 'プロンプトの更新に失敗しました' 
      });
    }

    return res.status(200).json({
      success: true,
      message: 'プロンプトが正常に更新されました',
      data: updatedPrompt
    });

  } catch (error) {
    console.error('プロンプト更新中の例外:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'サーバーエラーが発生しました' 
    });
  }
}

// プロンプト削除
async function deletePrompt(
  req: NextApiRequest,
  res: NextApiResponse,
  promptId: string
) {
  try {
    // 認証トークンを取得
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ 
        success: false, 
        error: 'ログインが必要です' 
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: '有効な認証トークンが必要です' 
      });
    }

    // ユーザー認証を確認
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ 
        success: false, 
        error: '認証に失敗しました' 
      });
    }

    // まず、プロンプトの存在と所有者チェック
    const { data: existingPrompt, error: fetchError } = await supabase
      .from('prompts')
      .select('id, author_id, title')
      .eq('id', promptId)
      .single();

    if (fetchError || !existingPrompt) {
      return res.status(404).json({ 
        success: false, 
        error: 'プロンプトが見つかりません' 
      });
    }

    // 所有者チェック
    if (existingPrompt.author_id !== user.id) {
      return res.status(403).json({ 
        success: false, 
        error: '他のユーザーのプロンプトを削除する権限がありません' 
      });
    }

    // 関連データの削除も考慮（カスケード削除が設定されていない場合）
    // トランザクション処理で関連データも削除
    try {
      // 管理者権限で削除（RLSポリシーを回避）
      const { error: deleteError } = await supabaseAdmin
        .from('prompts')
        .delete()
        .eq('id', promptId)
        .eq('author_id', user.id); // 追加のセキュリティチェック

      if (deleteError) {
        throw deleteError;
      }

      return res.status(200).json({
        success: true,
        message: 'プロンプトが正常に削除されました'
      });

    } catch (deleteError) {
      // 管理者権限での削除が失敗した場合、通常のクライアントで再試行
      const { error: regularDeleteError } = await supabase
        .from('prompts')
        .delete()
        .eq('id', promptId)
        .eq('author_id', user.id);

      if (regularDeleteError) {
        console.error('プロンプト削除エラー:', regularDeleteError);
        return res.status(500).json({ 
          success: false, 
          error: 'プロンプトの削除に失敗しました' 
        });
      }

      return res.status(200).json({
        success: true,
        message: 'プロンプトが正常に削除されました'
      });
    }

  } catch (error) {
    console.error('プロンプト削除中の例外:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'サーバーエラーが発生しました' 
    });
  }
} 