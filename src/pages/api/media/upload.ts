import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { isAuthenticated } from '../../../utils/auth';

// MIMEタイプマッピング（最適化）
const MIME_TYPE_MAP: Record<string, string> = {
  // 画像形式
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'gif': 'image/gif',
  'webp': 'image/webp',
  'svg': 'image/svg+xml',
  'bmp': 'image/bmp',
  'tiff': 'image/tiff',
  'tif': 'image/tiff',
  // 動画形式
  'mp4': 'video/mp4',
  'webm': 'video/webm',
  'mov': 'video/quicktime',
  'avi': 'video/avi'
};

const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 
  'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff'
];

const SUPPORTED_VIDEO_TYPES = [
  'video/mp4', 'video/webm', 'video/mov', 'video/avi', 'video/quicktime'
];

// 最適化されたMIMEタイプ検証
function validateAndFixMimeType(contentType: string, fileName: string): string {
  const isImage = contentType.startsWith('image/');
  const isVideo = contentType.startsWith('video/');
  
  if (!isImage && !isVideo) {
    throw new Error('許可されていないContentType: 画像または動画ファイルのみアップロード可能です');
  }

  const supportedTypes = [...SUPPORTED_IMAGE_TYPES, ...SUPPORTED_VIDEO_TYPES];
  
  if (supportedTypes.includes(contentType)) {
    return contentType;
  }

  // ファイル拡張子からMIMEタイプを推測
  const fileExt = fileName.split('.').pop()?.toLowerCase();
  const detectedType = fileExt ? MIME_TYPE_MAP[fileExt] : null;
  
  return detectedType || (isVideo ? 'video/mp4' : 'image/png');
}

// 最適化されたBase64処理
function processBase64Data(base64Data: string): Buffer {
  if (!base64Data?.includes('base64')) {
    throw new Error('無効なBase64データ形式');
  }

  const base64EncodedData = base64Data.split('base64,')[1];
  if (!base64EncodedData) {
    throw new Error('Base64データが見つかりません');
  }

  return Buffer.from(base64EncodedData, 'base64');
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // POSTリクエストのみ許可
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '許可されていないHTTPメソッド' });
  }

  try {
    // 並列で認証チェックとリクエストボディ検証
    const [user, { base64Data, fileName, contentType, bucketName }] = await Promise.all([
      isAuthenticated(req),
      Promise.resolve(req.body)
    ]);

    if (!user) {
      return res.status(401).json({ error: '認証されていません' });
    }

    // 必須パラメータチェック
    if (!base64Data || !fileName || !contentType || !bucketName) {
      return res.status(400).json({
        error: '必須パラメータが不足しています',
        required: ['base64Data', 'fileName', 'contentType', 'bucketName'],
        received: {
          base64Data: !!base64Data,
          fileName: !!fileName,
          contentType: !!contentType,
          bucketName: !!bucketName,
        },
      });
    }

    // 並列でMIMEタイプ検証とBase64処理
    const [finalContentType, buffer] = await Promise.all([
      Promise.resolve(validateAndFixMimeType(contentType, fileName)),
      Promise.resolve(processBase64Data(base64Data))
    ]);

    // Supabaseクライアント作成（最適化）
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
    );

    // 非同期アップロード
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(`${user.id}/${fileName}`, buffer, {
        contentType: finalContentType,
        upsert: true,
      });

    if (error) {
      console.error('Supabaseストレージアップロードエラー:', error);
      return res.status(500).json({
        error: 'ファイルアップロードに失敗しました',
        details: error.message,
      });
    }

    // 公開URL取得
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);

    const isVideo = finalContentType.startsWith('video/');

    return res.status(200).json({
      success: true,
      filePath: data.path,
      url: urlData.publicUrl,
      mediaType: isVideo ? 'video' : 'image',
      contentType: finalContentType,
    });
    
  } catch (error: any) {
    console.error('アップロードプロセスエラー:', error);
    return res.status(500).json({
      error: 'サーバーエラーが発生しました',
      details: error.message,
    });
  }
} 