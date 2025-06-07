import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabaseAdminClient';

/**
 * ストレージのファイルメタデータをSQLで直接修正するAPI
 * 
 * 使用例:
 * POST /api/storage/update-sql
 * {
 *   "fileName": "thumbnail-1746091820412.jpeg",
 *   "bucketName": "prompt-thumbnails",
 *   "mimeType": "image/jpeg"
 * }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // POSTリクエスト以外は許可しない
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileName, bucketName = 'prompt-thumbnails', mimeType = 'image/jpeg' } = req.body;
    
    if (!fileName) {
      return res.status(400).json({ 
        error: '必須パラメータが不足しています',
        required: ['fileName'] 
      });
    }
    
    console.log('SQLでのメタデータ更新リクエスト:', {
      bucketName,
      fileName,
      mimeType
    });
    
    // ファイルの存在確認（SQL使用）
    const { data: fileCheck, error: fileCheckError } = await supabaseAdmin.rpc('admin_query', {
      query_text: `
        SELECT id, name, metadata 
        FROM storage.objects 
        WHERE bucket_id = '${bucketName}'
        AND name = '${fileName}'
      `
    });
    
    if (fileCheckError) {
      console.error('ファイル存在確認エラー:', fileCheckError);
      return res.status(500).json({ 
        error: 'SQLクエリ実行エラー',
        message: fileCheckError.message
      });
    }
    
    if (!fileCheck || fileCheck.length === 0) {
      return res.status(404).json({ 
        error: 'ファイルが見つかりません',
        fileName,
        bucketName
      });
    }
    
    console.log('ファイル確認OK. 現在のメタデータ:', fileCheck[0].metadata);
    
    // SQLでMIMEタイプを直接更新
    const { data: updateResult, error: updateError } = await supabaseAdmin.rpc('admin_query', {
      query_text: `
        UPDATE storage.objects 
        SET metadata = jsonb_set(metadata, '{mimetype}', '"${mimeType}"')
        WHERE bucket_id = '${bucketName}'
        AND name = '${fileName}'
        RETURNING id, name, metadata
      `
    });
    
    if (updateError) {
      console.error('メタデータ更新エラー:', updateError);
      return res.status(500).json({ 
        error: 'メタデータ更新に失敗しました',
        message: updateError.message
      });
    }
    
    console.log('メタデータ更新完了:', updateResult);
    
    // 公開URLを取得
    const { data: urlData } = supabaseAdmin
      .storage
      .from(bucketName)
      .getPublicUrl(fileName);
    
    return res.status(200).json({
      success: true,
      message: 'SQLでファイルのMIMEタイプを更新しました',
      fileName,
      bucketName,
      originalMetadata: fileCheck[0].metadata,
      updatedMetadata: updateResult?.[0]?.metadata || '不明',
      mimeType,
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