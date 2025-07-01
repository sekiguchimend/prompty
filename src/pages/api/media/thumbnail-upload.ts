import { NextApiRequest, NextApiResponse } from 'next';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import { promises as fs } from 'fs';
import path from 'path';
import { getMimeTypeFromExt } from '../../../utils/file-upload';

// FormDataのパースを有効にする
export const config = {
  api: {
    bodyParser: false,
  },
};

// 最適化されたMIMEタイプ検出（非同期）
async function detectMimeType(buffer: Buffer, originalExt: string): Promise<string> {
  // マジックナンバーマッピング（最適化）
  const signatures: Record<string, number[]> = {
    'image/jpeg': [0xFF, 0xD8, 0xFF],
    'image/png': [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
    'image/gif': [0x47, 0x49, 0x46, 0x38],
    'image/webp': [0x52, 0x49, 0x46, 0x46],
    'video/mp4': [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70],
    'video/webm': [0x1A, 0x45, 0xDF, 0xA3],
    'video/ogg': [0x4F, 0x67, 0x67, 0x53],
    'video/avi': [0x52, 0x49, 0x46, 0x46]
  };
  
  // 最初の16バイトをチェック
  for (const mimeType in signatures) {
    const signature = signatures[mimeType];
    if (signature.every((byte: number, index: number) => buffer[index] === byte)) {
      return mimeType;
    }
  }
  
  // 拡張子ベースの検出（フォールバック）
  const detectedType = getMimeTypeFromExt(originalExt);
  if (detectedType?.startsWith('image/') || detectedType?.startsWith('video/')) {
    return detectedType;
  }
  
  // 拡張子マッピング（最適化）
  const extMap: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'mov': 'video/quicktime',
    'avi': 'video/avi'
  };
  
  return extMap[originalExt.toLowerCase()] || 'image/jpeg';
}

// 最適化された認証処理
async function authenticateUser(authHeader: string | undefined): Promise<SupabaseClient> {
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('認証ヘッダーがありません');
  }
  
  const sessionToken = authHeader.substring(7);
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const { data: userData, error: userError } = await adminSupabase.auth.getUser(sessionToken);
  if (userError || !userData.user) {
    throw new Error('ユーザー情報の取得に失敗しました');
  }
  
  return adminSupabase;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 認証処理（最適化）
    const supabase = await authenticateUser(req.headers.authorization);

    // 非同期フォームパース
    const form = formidable({ 
      multiples: false,
      keepExtensions: true,
      maxFileSize: 40 * 1024 * 1024 * 1024 // 40GB制限
    });
    
    const { files } = await new Promise<{ fields: formidable.Fields, files: formidable.Files }>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve({ fields, files });
      });
    });

    const thumbnail = files.thumbnailImage;
    const thumbnailFile = Array.isArray(thumbnail) ? thumbnail[0] : thumbnail;
    
    if (!thumbnailFile?.filepath) {
      return res.status(400).json({ error: 'サムネイル画像・動画が提供されていません' });
    }

    // 非同期ファイル処理
    const [fileBuffer, originalExt] = await Promise.all([
      fs.readFile(thumbnailFile.filepath),
      Promise.resolve(path.extname(thumbnailFile.originalFilename || '').substring(1) || 'jpg')
    ]);
    
    // 非同期MIMEタイプ検出
    const contentType = await detectMimeType(fileBuffer, originalExt);
    
    // MIMEタイプ検証
    const isImage = contentType.startsWith('image/');
    const isVideo = contentType.startsWith('video/');
    
    if (!isImage && !isVideo) {
      return res.status(400).json({ 
        error: '無効なファイル形式です。画像または動画ファイルのみアップロード可能です。', 
        detectedType: contentType 
      });
    }

    // ファイル名生成
    const timestamp = Date.now();
    const fileName = `thumbnail-${timestamp}.${originalExt}`;

    // 最適化されたアップロード処理
    const { error: uploadError } = await supabase.storage
      .from('prompt-thumbnails')
      .upload(fileName, fileBuffer, {
        contentType: contentType,
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      if (uploadError.message.includes('security policy')) {
        return res.status(403).json({ 
          error: 'アップロード権限がありません', 
          details: 'Row Level Security ポリシーによってアップロードが拒否されました。'
        });
      }
      
      return res.status(500).json({ 
        error: 'サムネイル画像のアップロードに失敗しました', 
        details: uploadError.message
      });
    }

    // 公開URL取得
    const { data: { publicUrl } } = supabase.storage
      .from('prompt-thumbnails')
      .getPublicUrl(fileName);

    // URLパスの修正（必要に応じて）
    const finalPublicUrl = publicUrl.includes('/object/public/') 
      ? publicUrl 
      : publicUrl.replace('/object/', '/object/public/');

    return res.status(200).json({
      success: true,
      publicUrl: finalPublicUrl,
      mimeType: contentType,
      mediaType: isVideo ? 'video' : 'image'
    });
    
  } catch (error: any) {
    if (error.message.includes('認証')) {
      return res.status(401).json({ 
        error: '認証エラー', 
        details: error.message 
      });
    }
    
    return res.status(500).json({ 
      error: '予期せぬエラーが発生しました', 
      message: error.message || 'Unknown error'
    });
  }
}