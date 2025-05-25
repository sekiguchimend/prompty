import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabaseAdminClient';

/**
 * 特定のファイルのMIMEタイプを修正するユーティリティAPI
 * 
 * 使用例:
 * POST /api/storage/fix-mime-type
 * {
 *   "fileName": "thumbnail-1746091820412.jpeg",
 *   "bucketName": "prompt-thumbnails"
 * }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // POSTリクエスト以外は許可しない
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileName, bucketName = 'prompt-thumbnails' } = req.body;
    
    if (!fileName) {
      return res.status(400).json({ 
        error: '必須パラメータが不足しています',
        required: ['fileName'] 
      });
    }
    
    console.log('MIMEタイプ修正リクエスト:', {
      bucketName,
      fileName
    });
    
    // ファイル名から適切なMIMEタイプを判定
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    let contentType = 'image/jpeg'; // デフォルト
    
    // 拡張子からMIMEタイプを判定
    const extToMime: Record<string, string> = {
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
    
    if (fileExtension && extToMime[fileExtension]) {
      contentType = extToMime[fileExtension];
    }
    
    console.log(`ファイル拡張子 "${fileExtension}" から "${contentType}" を判定しました`);
    
    // ファイルの存在確認
    const { data: fileData, error: fileCheckError } = await supabaseAdmin
      .storage
      .from(bucketName)
      .download(fileName);
    
    if (fileCheckError) {
      console.error('ファイル存在確認エラー:', fileCheckError);
      return res.status(404).json({ 
        error: 'ファイルが見つかりません',
        message: fileCheckError.message
      });
    }
    
    console.log('ファイル確認OK. 現在のタイプ:', fileData.type);
    
    // ファイルのバイナリデータを取得
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    
    // 一度ファイルを削除
    const { error: deleteError } = await supabaseAdmin
      .storage
      .from(bucketName)
      .remove([fileName]);
    
    if (deleteError) {
      console.error('ファイル削除エラー:', deleteError);
      return res.status(500).json({ 
        error: 'ファイル削除に失敗しました',
        message: deleteError.message
      });
    }
    
    // 同じファイル名で正しいMIMEタイプで再アップロード
    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from(bucketName)
      .upload(fileName, buffer, {
        contentType: contentType,
        upsert: true
      });
    
    if (uploadError) {
      console.error('ファイル再アップロードエラー:', uploadError);
      return res.status(500).json({ 
        error: 'ファイル再アップロードに失敗しました',
        message: uploadError.message
      });
    }
    
    // 公開URLを取得
    const { data: urlData } = supabaseAdmin
      .storage
      .from(bucketName)
      .getPublicUrl(fileName);
    
    console.log('MIMEタイプ修正完了:', {
      path: uploadData.path,
      originalType: fileData.type,
      newType: contentType,
      publicUrl: urlData.publicUrl
    });
    
    return res.status(200).json({
      success: true,
      message: 'ファイルのMIMEタイプを修正しました',
      path: uploadData.path,
      originalType: fileData.type,
      newType: contentType,
      publicUrl: urlData.publicUrl
    });
    
  } catch (err) {
    console.error('サーバーエラー:', err);
    return res.status(500).json({ 
      error: '予期しないエラーが発生しました',
      message: err instanceof Error ? err.message : 'Unknown error'
    });
  }
} 