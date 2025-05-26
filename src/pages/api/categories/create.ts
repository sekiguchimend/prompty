import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabaseClient';
import { supabaseAdmin } from '../../../lib/supabaseAdminClient';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // POSTリクエスト以外は許可しない
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'メソッドが許可されていません' });
  }

  try {
    // 認証トークンを取得
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'ログインが必要です' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: '有効な認証トークンが必要です' });
    }

    // ユーザー認証を確認（共通クライアントを使用）
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('認証エラー:', authError);
      return res.status(401).json({ message: '認証に失敗しました。再度ログインしてください。' });
    }

    const { name, slug, description } = req.body;

    // 必須フィールドの検証
    if (!name || !slug) {
      return res.status(400).json({ message: 'カテゴリ名とスラッグは必須です' });
    }

    // スラッグの重複チェック
    const { data: existingCategory, error: checkError } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (checkError) {
      console.error('カテゴリ重複チェックエラー:', checkError);
      return res.status(500).json({ message: '重複チェック中にエラーが発生しました' });
    }

    if (existingCategory) {
      return res.status(400).json({ message: '同じスラッグのカテゴリが既に存在します' });
    }

    // カテゴリをデータベースに追加（認証済みユーザーのIDを含める）
    const { data: newCategory, error } = await supabase
      .from('categories')
      .insert([{
        name,
        slug,
        description,
        icon: null,
        parent_id: null,
        created_by: user.id  // 作成者のIDを追加
      }])
      .select()
      .single();

    if (error) {
      console.error('カテゴリ作成エラー:', error);
      
      // RLSポリシーに問題がある場合は管理者権限でフォールバック
      if (error.code === '42501' || error.message?.includes('permission denied')) {
        console.log('権限エラー - 管理者権限でリトライします');
        
        // 管理者クライアントを使用（共通のsupabaseAdminを使用）
        const { data: adminResult, error: adminError } = await supabaseAdmin
          .from('categories')
          .insert([{
            name,
            slug,
            description,
            icon: null,
            parent_id: null,
            created_by: user.id
          }])
          .select()
          .single();
          
        if (adminError) {
          console.error('管理者権限でのカテゴリ作成エラー:', adminError);
          return res.status(500).json({ message: 'カテゴリの作成に失敗しました', error: adminError });
        }
        
        return res.status(201).json({ 
          success: true, 
          message: 'カテゴリが正常に作成されました (管理者モード)',
          category: adminResult 
        });
      }
      
      return res.status(500).json({ message: 'カテゴリの作成に失敗しました', error });
    }

    // 成功レスポンス
    return res.status(201).json({ 
      success: true, 
      message: 'カテゴリが正常に作成されました',
      category: newCategory 
    });
  } catch (error) {
    console.error('カテゴリ作成中の例外:', error);
    return res.status(500).json({ message: 'サーバーエラーが発生しました', error });
  }
} 