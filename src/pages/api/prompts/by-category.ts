import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// サーバーサイドでのSupabaseクライアント
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('環境変数が設定されていません: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
}

// サーバーサイド用のクライアント（管理者権限）
const supabase = createClient(
  supabaseUrl || '',
  supabaseServiceKey || ''
);

// 特別なカテゴリー名とそのスラッグ定義
const SPECIAL_CATEGORIES: Record<string, string> = {
  '生成AI': 'generative-ai',
  '画像生成': 'image-generation'
};

// いいね数を取得して追加する関数
async function addLikeCounts(prompts: any[]): Promise<any[]> {
  if (!prompts || prompts.length === 0) return [];

  const promptIds = prompts.map(p => p.id);
  
  // プロンプトIDごとのいいね数を格納するオブジェクト
  const likeCounts: Record<string, number> = {};
  
  try {
    // いいねの数をカウントするクエリ
    const { data, error } = await supabase
      .from('likes')
      .select('prompt_id')
      .in('prompt_id', promptIds);
      
    if (error) {
      console.error('いいね数取得エラー:', error);
      return prompts;
    }
    
    // 各プロンプトIDごとのいいね数を集計
    if (data) {
      data.forEach(item => {
        const promptId = item.prompt_id as string;
        likeCounts[promptId] = (likeCounts[promptId] || 0) + 1;
      });
    }
    
    // 元のプロンプトデータにいいね数を追加
    return prompts.map(prompt => ({
      ...prompt,
      like_count: likeCounts[prompt.id] || 0
    }));
  } catch (err) {
    console.error('いいね数処理中のエラー:', err);
    return prompts;
  }
}

// カテゴリー名の比較関数（大文字小文字、全角半角を区別しない）
const isCategoryNameMatched = (categoryName: string, targetName: string): boolean => {
  // 全角を半角に変換し、小文字に統一して比較
  const normalize = (str: string) => str.toLowerCase().replace(/[Ａ-Ｚａ-ｚ０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
  return normalize(categoryName) === normalize(targetName) || categoryName === targetName;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 特別なカテゴリーの存在確認・作成
    await ensureSpecialCategories();
    
    // カテゴリー全て取得
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .order('name');
      
    if (categoriesError) {
      console.error('カテゴリー取得エラー:', categoriesError);
      return res.status(500).json({ error: 'カテゴリーの取得に失敗しました' });
    }
    
    if (!categories || categories.length === 0) {
      return res.status(404).json({ error: 'カテゴリーが見つかりません' });
    }
    
    // 特別なカテゴリーとそれ以外を分離
    const specialCategories: any[] = [];
    const regularCategories: any[] = [];
    
    // カテゴリーの仕分け処理
    categories.forEach(category => {
      // カテゴリー名が特別なカテゴリーに含まれているかチェック（大文字小文字・全角半角区別なし）
      const isSpecial = Object.keys(SPECIAL_CATEGORIES).some(specialName => 
        isCategoryNameMatched(category.name, specialName)
      );
      
      if (isSpecial) {
        specialCategories.push(category);
      } else {
        regularCategories.push(category);
      }
    });
    
    // 特別なカテゴリーの記事を取得
    const specialCategoryPromises = specialCategories.map(async (category) => {
      try {
        // カテゴリーに属する記事を取得
        const { data: promptsData, error: promptsError } = await supabase
          .from('prompts')
          .select(`
            id,
            title,
            thumbnail_url,
            created_at,
            view_count,
            profiles:author_id (
              id,
              display_name,
              username,
              avatar_url
            )
          `)
          .eq('category_id', category.id.toString())
          .eq('published', true)
          .order('created_at', { ascending: false })
          .limit(10);
          
        if (promptsError) {
          console.error(`${category.name}カテゴリの記事取得エラー:`, promptsError);
          return {
            category,
            prompts: []
          };
        }
        
        // いいね数を取得して追加
        const promptsWithLikes = await addLikeCounts(promptsData || []);
          
        return {
          category,
          prompts: promptsWithLikes
        };
      } catch (err) {
        console.error(`「${category.name}」カテゴリーの記事取得中にエラー:`, err);
        return {
          category,
          prompts: []
        };
      }
    });
    
    // 通常のカテゴリーの記事を取得
    const regularCategoryPromises = regularCategories.map(async (category) => {
      try {
        const { data: promptsData, error: promptsError } = await supabase
          .from('prompts')
          .select(`
            id,
            title,
            thumbnail_url,
            created_at,
            view_count,
            profiles:author_id (
              id,
              display_name,
              username,
              avatar_url
            )
          `)
          .eq('category_id', category.id.toString())
          .eq('published', true)
          .order('created_at', { ascending: false })
          .limit(10);
          
        if (promptsError) {
          console.error(`${category.name}カテゴリの記事取得エラー:`, promptsError);
          return {
            category,
            prompts: []
          };
        }
        
        // いいね数を取得して追加
        const promptsWithLikes = await addLikeCounts(promptsData || []);
        
        return {
          category,
          prompts: promptsWithLikes
        };
      } catch (err) {
        console.error(`「${category.name}」カテゴリーの記事取得中にエラー:`, err);
        return {
          category,
          prompts: []
        };
      }
    });
    
    // すべてのカテゴリーの記事を取得
    const specialResults = await Promise.all(specialCategoryPromises);
    const regularResults = await Promise.all(regularCategoryPromises);
    
    // 通常カテゴリーは記事がある（1つ以上）カテゴリーのみをフィルタリング
    const validRegularCategories = regularResults.filter(item => item.prompts.length > 0);
    
    return res.status(200).json({
      specialCategories: specialResults,
      regularCategories: validRegularCategories
    });
    
  } catch (error) {
    console.error('データ取得エラー:', error);
    return res.status(500).json({ 
      error: 'データの取得中にエラーが発生しました',
      message: error instanceof Error ? error.message : '不明なエラー'
    });
  }
}

// 特定のカテゴリーがなければ作成する関数
async function ensureSpecialCategories() {
  try {
    // 特別なカテゴリーの存在確認
    for (const [categoryName, specialSlug] of Object.entries(SPECIAL_CATEGORIES)) {
      const { data: existingCategory, error: checkError } = await supabase
        .from('categories')
        .select('id')
        .ilike('name', categoryName)
        .maybeSingle();
        
      if (checkError) {
        console.error(`カテゴリー「${categoryName}」確認エラー:`, checkError);
        continue;
      }
      
      // カテゴリーが存在しない場合は作成
      if (!existingCategory) {
        const { error: createError } = await supabase
          .from('categories')
          .insert([{
            name: categoryName,
            slug: specialSlug,
            description: `${categoryName}に関する記事`
          }]);
          
        if (createError) {
          console.error(`カテゴリー「${categoryName}」作成エラー:`, createError);
        }
      }
    }
  } catch (error) {
    console.error('特別カテゴリー確認/作成エラー:', error);
  }
} 