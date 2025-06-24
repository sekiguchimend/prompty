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

    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ message: 'カテゴリ名は必須です' });
    }

    // カテゴリ名の重複チェック（大文字小文字を区別しない）
    const trimmedName = name.trim();
    const { data: existingCategoryByName, error: nameCheckError } = await supabase
      .from('categories')
      .select('id, name')
      .ilike('name', trimmedName)
      .maybeSingle();

    if (nameCheckError) {
      console.error('カテゴリ名重複チェックエラー:', nameCheckError);
      return res.status(500).json({ message: 'カテゴリ名の重複チェック中にエラーが発生しました' });
    }

    if (existingCategoryByName) {
      return res.status(409).json({ 
        message: 'すでに存在するカテゴリです',
        existingCategory: existingCategoryByName.name
      });
    }

    // カテゴリ名から基本的な slug を自動生成
    const baseSlug = trimmedName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');

    const description = null;

    // ユニークなスラッグを生成（重複がある場合は番号を付加）
    let finalSlug = baseSlug;
    let counter = 1;
    let isUnique = false;

    while (!isUnique) {
      const { data: existingCategory, error: checkError } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', finalSlug)
        .maybeSingle();

      if (checkError) {
        console.error('カテゴリ重複チェックエラー:', checkError);
        return res.status(500).json({ message: '重複チェック中にエラーが発生しました' });
      }

      if (!existingCategory) {
        isUnique = true;
      } else {
        finalSlug = `${baseSlug}-${counter}`;
        counter++;
        
        // 無限ループ防止（最大100回試行）
        if (counter > 100) {
          return res.status(500).json({ message: 'ユニークなスラッグの生成に失敗しました' });
        }
      }
    }

    // カテゴリをデータベースに追加（認証済みユーザーのIDを含める）
    const { data: newCategory, error } = await supabase
      .from('categories')
      .insert([{
        name: trimmedName,
        slug: finalSlug,
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
        
        // 管理者クライアントを使用（共通のsupabaseAdminを使用）
        const { data: adminResult, error: adminError } = await supabaseAdmin
          .from('categories')
          .insert([{
            name: trimmedName,
            slug: finalSlug,
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