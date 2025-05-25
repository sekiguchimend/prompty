import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { isAuthenticated } from '../../../utils/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // POSTリクエストのみ許可
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '許可されていないHTTPメソッド' });
  }

  // ユーザー認証チェック
  const user = await isAuthenticated(req);
  if (!user) {
    return res.status(401).json({ error: '認証されていません' });
  }

  try {
    const { base64Data, fileName, contentType, bucketName } = req.body;

    // 必須パラメータをチェック
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

    // Base64データの形式チェック
    if (!base64Data.includes('base64')) {
      return res.status(400).json({ error: '無効なBase64データ形式' });
    }

    // ContentTypeが画像形式かチェック
    if (!contentType.startsWith('image/')) {
      console.warn(`非画像MIMEタイプ "${contentType}" は許可されていません`);
      return res.status(400).json({ 
        error: '許可されていないContentType', 
        message: 'アップロードできるのは画像ファイルのみです',
        providedType: contentType
      });
    }

    // サポートする画像形式の定義
    const supportedImageTypes = [
      'image/jpeg', 'image/png', 'image/gif', 
      'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff'
    ];

    // MIMEタイプが未サポートの場合は拡張子に基づいて正しいMIMEタイプを設定
    let finalContentType = contentType;
    if (!supportedImageTypes.includes(contentType)) {
      console.warn(`未サポートの画像形式 "${contentType}" を検出`);
      
      // ファイル拡張子からMIMEタイプを推測
      const fileExt = fileName.split('.').pop()?.toLowerCase();
      if (fileExt) {
        const mimeMapping: { [key: string]: string } = {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'gif': 'image/gif',
          'webp': 'image/webp',
          'svg': 'image/svg+xml',
          'bmp': 'image/bmp',
          'tiff': 'image/tiff',
          'tif': 'image/tiff'
        };
        
        if (mimeMapping[fileExt]) {
          finalContentType = mimeMapping[fileExt];
          console.log(`ファイル拡張子から正しいMIMEタイプを設定: ${finalContentType}`);
        } else {
          finalContentType = 'image/png'; // デフォルト値
          console.log(`不明な拡張子のため、デフォルトのMIMEタイプを使用: ${finalContentType}`);
        }
      } else {
        finalContentType = 'image/png'; // デフォルト値
        console.log(`拡張子がないため、デフォルトのMIMEタイプを使用: ${finalContentType}`);
      }
    }

    // Base64データからバイナリデータを抽出
    const base64EncodedData = base64Data.split('base64,')[1];
    const buffer = Buffer.from(base64EncodedData, 'base64');

    // Supabaseクライアントの作成
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
    );

    console.log(`ファイルアップロード開始: ${fileName} (${finalContentType}) -> ${bucketName}`);

    // Supabaseストレージにアップロード
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

    console.log('アップロード成功:', data.path);

    // アップロードされたファイルの公開URLを取得
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);

    console.log('公開URL生成:', urlData.publicUrl);

    return res.status(200).json({
      success: true,
      filePath: data.path,
      url: urlData.publicUrl,
    });
  } catch (error: any) {
    console.error('アップロードプロセスエラー:', error);
    return res.status(500).json({
      error: 'サーバーエラーが発生しました',
      details: error.message,
    });
  }
} 