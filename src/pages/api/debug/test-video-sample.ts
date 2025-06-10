import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // テスト用のサンプルデータ（動画URLを含む）
    const testSamples = [
      {
        id: "test-image-1",
        title: "テスト画像ファイル",
        thumbnailUrl: "https://example.com/image.jpg",
        mediaType: "image"
      },
      {
        id: "test-video-1", 
        title: "テスト動画ファイル MP4",
        thumbnailUrl: "https://example.com/video.mp4",
        mediaType: "video"
      },
      {
        id: "test-video-2",
        title: "テスト動画ファイル WebM", 
        thumbnailUrl: "https://example.com/video.webm",
        mediaType: "video"
      },
      {
        id: "test-video-3",
        title: "テスト動画ファイル MOV",
        thumbnailUrl: "https://example.com/video.mov", 
        mediaType: "video"
      }
    ];

    // 動画判定ロジックのテスト
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
    
    const analysisResults = testSamples.map(sample => {
      const isVideo = videoExtensions.some(ext => sample.thumbnailUrl.toLowerCase().includes(ext));
      
      return {
        ...sample,
        detectedAsVideo: isVideo,
        expectedType: sample.mediaType,
        correct: (isVideo && sample.mediaType === 'video') || (!isVideo && sample.mediaType === 'image')
      };
    });

    const videoCount = analysisResults.filter(item => item.detectedAsVideo).length;
    const correctDetections = analysisResults.filter(item => item.correct).length;

    return res.status(200).json({
      message: "動画判定ロジックのテスト結果",
      totalSamples: testSamples.length,
      videoDetectedCount: videoCount,
      correctDetections: correctDetections,
      accuracy: `${(correctDetections / testSamples.length * 100).toFixed(1)}%`,
      videoExtensions: videoExtensions,
      detailResults: analysisResults
    });

  } catch (error) {
    console.error('テストAPI エラー:', error);
    return res.status(500).json({ 
      error: 'テスト実行中にエラーが発生しました',
      message: error instanceof Error ? error.message : '不明なエラー'
    });
  }
} 