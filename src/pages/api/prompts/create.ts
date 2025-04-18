import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

// 認証トークンからユーザーIDを抽出する関数
async function getUserIdFromToken(token: string): Promise<string | null> {
  try {
    // JWT検証を行い、ユーザー情報を取得
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error) {
      console.error('認証トークン検証エラー:', error.message);
      return null;
    }
    
    if (data && data.user && data.user.id) {
      console.log('認証済みユーザーID:', data.user.id);
      return data.user.id;
    }
    
    return null;
  } catch (error) {
    console.error('トークン検証エラー:', error);
    return null;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // OPTIONSリクエストに対しては即座にOKを返す（CORS対策）
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POSTリクエスト以外は許可しない
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method Not Allowed'
    });
  }

  try {
    // リクエストからデータを取得
    const {
      title,
      description,
      content,
      thumbnail_url,
      category_id,
      price,
      is_free,
      ai_model,
      author_id
    } = req.body;

    // 認証トークンからユーザーIDを取得
    let authenticatedUserId: string | null = null;
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7); // 'Bearer 'の後の部分を取得
      authenticatedUserId = await getUserIdFromToken(token);
      console.log('リクエストから認証済みユーザーID取得:', authenticatedUserId);
    }

    // 必須項目の検証
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: '必須項目が不足しています（タイトルとコンテンツは必須です）'
      });
    }
    
    // 投稿データの準備
    // 認証されたユーザーIDが存在する場合はそれを優先、なければ提供されたauthor_idを使用
    const finalAuthorId = authenticatedUserId || author_id || `anon-${uuidv4()}`;
    const isAnonymous = !authenticatedUserId && (!author_id || author_id.startsWith('anon-'));
    
    console.log('投稿処理：', {
      提供されたAuthorId: author_id,
      認証済みUserId: authenticatedUserId,
      最終AuthorId: finalAuthorId,
      匿名投稿: isAnonymous
    });

    // プロンプトの作成日時
    const createdAt = new Date();

    // Supabaseへのデータ挿入
    const { data, error } = await supabase
      .from('prompts')
      .insert([
        {
          id: uuidv4(), // 一意のIDを生成
          title,
          description: description || '',
          content,
          thumbnail_url: thumbnail_url || null,
          category_id: category_id || null,
          price: price || 0,
          is_free: is_free !== undefined ? is_free : true,
          ai_model: ai_model || null,
          author_id: finalAuthorId,
          created_at: createdAt.toISOString(),
          updated_at: createdAt.toISOString(),
          is_published: true,
          is_anonymous: isAnonymous
        }
      ])
      .select('id');

    if (error) {
      console.error('Supabase挿入エラー:', error.message, error.details);
      return res.status(500).json({
        success: false,
        message: 'データベースエラーが発生しました',
        error: error.message
      });
    }

    console.log('プロンプト作成成功:', data);

    // 成功レスポンス
    return res.status(201).json({
      success: true,
      message: 'プロンプトが正常に作成されました',
      data: data[0]
    });
  } catch (error) {
    console.error('予期せぬエラー:', error);
    return res.status(500).json({
      success: false,
      message: '予期せぬエラーが発生しました',
      error: error instanceof Error ? error.message : '不明なエラー'
    });
  }
} 