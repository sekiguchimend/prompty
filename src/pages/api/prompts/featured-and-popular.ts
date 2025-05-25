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

  try {
    // クエリパラメータから表示数を取得（デフォルト10件）
    const limit = parseInt(req.query.limit as string) || 10;
    
    // 1. フィーチャープロンプトの取得
    const { data: featuredData, error: featuredError } = await supabase
      .from('prompts')
      .select(`
        id,
        title,
        thumbnail_url,
        created_at,
        author_id,
        profiles!prompts_author_id_fkey(id, username, display_name, avatar_url)
      `)
      .eq('is_featured', true)
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (featuredError) {
      console.error('フィーチャープロンプト取得エラー:', featuredError);
      return res.status(500).json({ error: 'フィーチャープロンプトの取得に失敗しました' });
    }

    // 2. 人気プロンプトの取得
    const { data: popularData, error: popularError } = await supabase
      .from('prompts')
      .select(`
        id,
        title,
        thumbnail_url,
        created_at,
        author_id,
        view_count,
        profiles!prompts_author_id_fkey(id, username, display_name, avatar_url)
      `)
      .eq('published', true)
      .order('view_count', { ascending: false })
      .limit(limit);

    if (popularError) {
      console.error('人気プロンプト取得エラー:', popularError);
      return res.status(500).json({ error: '人気プロンプトの取得に失敗しました' });
    }

    // 3. すべてのプロンプトIDを結合してユニークにする
    const allPrompts = [
      ...(featuredData || []),
      ...(popularData || [])
    ];
    
    const uniquePromptIds = Array.from(new Set(allPrompts.map(p => p.id)));
    
    // 4. いいね数を取得して追加
    const featuredPromptsWithLikes = await addLikeCounts(featuredData || []);
    const popularPromptsWithLikes = await addLikeCounts(popularData || []);
    
    return res.status(200).json({
      featuredPrompts: featuredPromptsWithLikes,
      popularPrompts: popularPromptsWithLikes
    });
    
  } catch (error) {
    console.error('データ取得エラー:', error);
    return res.status(500).json({ 
      error: 'データの取得中にエラーが発生しました',
      message: error instanceof Error ? error.message : '不明なエラー'
    });
  }
} 