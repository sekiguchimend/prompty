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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { categories, sortBy } = req.query;
    
    // クエリパラメータのログ出力

    // カテゴリIDが指定されている場合の処理
    let query = supabase
      .from('prompts')
      .select(`
        id,
        title,
        description,
        thumbnail_url,
        created_at,
        view_count,
        author_id,
        category_id,
        profiles:author_id (
          id,
          display_name,
          username,
          avatar_url
        ),
        categories:category_id (
          id,
          name,
          slug
        )
      `)
      .eq('published', true);

    // カテゴリフィルタリング
    if (categories && typeof categories === 'string') {
      query = query.eq('category_id', categories);
    }

    // ソート順の適用
    switch (sortBy) {
      case 'recommended':
        // おすすめ順（ビュー数とランダム要素を組み合わせ）
        query = query.order('view_count', { ascending: false });
        break;
      case 'latest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'popular':
        query = query.order('view_count', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    // 結果を取得（最大50件）
    const { data: promptsData, error: promptsError } = await query.limit(50);

    if (promptsError) {
      console.error('プロンプト取得エラー:', promptsError);
      return res.status(500).json({ error: 'データの取得に失敗しました' });
    }

    // いいね数を取得して追加
    const promptsWithLikes = await addLikeCounts(promptsData || []);

    return res.status(200).json({
      success: true,
      data: promptsWithLikes,
      total: promptsWithLikes.length,
      filters: {
        categories,
        sortBy
      }
    });

  } catch (error) {
    console.error('ガチャAPIエラー:', error);
    return res.status(500).json({ 
      error: 'サーバーエラーが発生しました',
      message: error instanceof Error ? error.message : '不明なエラー'
    });
  }
}

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