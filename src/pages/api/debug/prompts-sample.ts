import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// サーバーサイドでのSupabaseクライアント
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(
  supabaseUrl || '',
  supabaseServiceKey || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // サムネイルURLのサンプルを取得
    const { data: prompts, error } = await supabase
      .from('prompts')
      .select('id, title, thumbnail_url, created_at')
      .limit(20)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('プロンプト取得エラー:', error);
      return res.status(500).json({ error: 'データ取得に失敗しました' });
    }

    // 動画ファイルの拡張子判定
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
    
    const analysisResults = prompts?.map(prompt => {
      const thumbnailUrl = prompt.thumbnail_url || '';
      const isVideo = videoExtensions.some(ext => thumbnailUrl.toLowerCase().includes(ext));
      
      return {
        id: prompt.id,
        title: prompt.title,
        thumbnailUrl: thumbnailUrl,
        isVideo: isVideo,
        hasVideoExtension: videoExtensions.find(ext => thumbnailUrl.toLowerCase().includes(ext)) || null
      };
    }) || [];

    const videoCount = analysisResults.filter(item => item.isVideo).length;
    const imageCount = analysisResults.filter(item => !item.isVideo).length;

    return res.status(200).json({
      totalCount: prompts?.length || 0,
      videoCount: videoCount,
      imageCount: imageCount,
      videoExtensions: videoExtensions,
      samples: analysisResults
    });

  } catch (error) {
    console.error('API エラー:', error);
    return res.status(500).json({ 
      error: 'サーバーエラーが発生しました',
      message: error instanceof Error ? error.message : '不明なエラー'
    });
  }
} 