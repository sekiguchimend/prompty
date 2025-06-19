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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // URLからスラッグを取得
  const { slug } = req.query;
  
  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: 'カテゴリースラッグが必要です' });
  }

  try {
    // カテゴリー情報を取得
    const { data: categoryData, error: categoryError } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (categoryError) {
      console.error('カテゴリー取得エラー:', categoryError);
      return res.status(500).json({ error: 'カテゴリーの取得に失敗しました' });
    }
    
    if (!categoryData) {
      return res.status(404).json({ error: '指定されたカテゴリーが見つかりません' });
    }
    
    // そのカテゴリーに属する記事を取得
    const { data: promptsData, error: promptsError } = await supabase
      .from('prompts')
      .select(`
        id,
        title,
        thumbnail_url,
        media_type,
        created_at,
        view_count,
        profiles:author_id (
          id,
          display_name,
          username,
          avatar_url
        )
      `)
      .eq('category_id', categoryData.id.toString())
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(30); // 一覧ページなのでより多く表示
      
    if (promptsError) {
      console.error('記事取得エラー:', promptsError);
      return res.status(500).json({ error: '記事の取得に失敗しました' });
    }
    
    // いいね数を取得して追加
    const promptsWithLikes = await addLikeCounts(promptsData || []);
    
    return res.status(200).json({
      category: categoryData,
      prompts: promptsWithLikes
    });
    
  } catch (error) {
    console.error('データ取得エラー:', error);
    return res.status(500).json({ 
      error: 'データの取得中にエラーが発生しました',
      message: error instanceof Error ? error.message : '不明なエラー'
    });
  }
} 