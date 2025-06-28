import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabaseAdminClient';

// いいね数を取得して追加する関数
async function addLikeCounts(prompts: any[]): Promise<any[]> {
  if (!prompts || prompts.length === 0) return [];

  const promptIds = prompts.map(p => p.id);
  
  // プロンプトIDごとのいいね数を格納するオブジェクト
  const likeCounts: Record<string, number> = {};
  
  try {
    // いいねの数をカウントするクエリ
    const { data, error } = await supabaseAdmin
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
    console.error('いいね数処理エラー:', err);
    return prompts;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 新着記事を30件取得（作成日時の降順）
    const { data: recentPrompts, error } = await supabaseAdmin
      .from('prompts')
      .select(`
        id,
        title,
        thumbnail_url,
        created_at,
        view_count,
        media_type,
        published,
        profiles!inner (
          display_name,
          avatar_url
        )
      `)
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) {
      console.error('新着記事取得エラー:', error);
      return res.status(500).json({ error: '新着記事の取得に失敗しました' });
    }

    // いいね数を取得して追加
    const recentPromptsWithLikes = await addLikeCounts(recentPrompts || []);

    res.status(200).json({ recentPrompts: recentPromptsWithLikes });
  } catch (error) {
    console.error('新着記事API エラー:', error);
    res.status(500).json({ error: '内部サーバーエラー' });
  }
} 