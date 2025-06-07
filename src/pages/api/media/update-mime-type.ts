import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabaseAdminClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // POSTリクエスト以外は許可しない
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { bucketName, fileName, contentType } = req.body;
    
    if (!bucketName || !fileName || !contentType) {
      return res.status(400).json({ 
        error: '必須パラメータが不足しています',
        required: ['bucketName', 'fileName', 'contentType'] 
      });
    }
    
    console.log('MIMEタイプ更新リクエスト:', {
      bucketName,
      fileName,
      contentType
    });
    
    // サポートされている画像MIME型かチェック
    if (!contentType.startsWith('image/')) {
      return res.status(400).json({ 
        error: '無効なコンテンツタイプ',
        message: '画像のMIMEタイプのみサポートしています' 
      });
    }
    
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
    
    console.log('MIMEタイプ更新完了:', {
      path: uploadData.path,
      contentType: contentType,
      publicUrl: urlData.publicUrl
    });
    
    return res.status(200).json({
      success: true,
      message: 'ファイルのMIMEタイプを更新しました',
      path: uploadData.path,
      contentType: contentType,
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