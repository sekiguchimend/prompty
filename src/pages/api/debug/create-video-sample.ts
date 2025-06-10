import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // サンプル動画データを作成
    const sampleVideoData = {
      title: 'テスト動画サムネイル',
      description: 'これは動画対応のテストです',
      content: 'テスト用の動画プロンプト',
      prompt_title: 'テスト動画プロンプト',
      prompt_content: 'これは動画対応のテストプロンプトです。',
      thumbnail_url: 'https://example.com/sample-video.mp4', // 動画URL
      media_type: 'video', // 重要: 動画として設定
      author_id: 'test-user-id',
      category_id: null,
      price: 0,
      is_free: true,
      published: true
    };

    const { data, error } = await supabase
      .from('prompts')
      .insert([sampleVideoData])
      .select();

    if (error) {
      console.error('サンプル動画作成エラー:', error);
      return res.status(500).json({ 
        error: 'サンプル動画の作成に失敗しました',
        details: error.message 
      });
    }

    res.status(200).json({
      success: true,
      message: 'サンプル動画データを作成しました',
      data: data
    });

  } catch (error: any) {
    console.error('予期せぬエラー:', error);
    res.status(500).json({ 
      error: '予期せぬエラーが発生しました',
      details: error.message 
    });
  }
} 