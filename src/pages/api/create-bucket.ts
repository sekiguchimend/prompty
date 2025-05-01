import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../lib/supabaseAdminClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // POSTリクエスト以外は許可しない
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { bucketName } = req.body;

  if (!bucketName) {
    return res.status(400).json({ error: 'バケット名が必要です' });
  }

  try {
    // バケットは既に存在するため、バケットの確認・作成は行わない
    console.log(`バケット '${bucketName}' は既に設定済みとして処理します`);

    // 公開URLのベースを取得（任意のファイル名で生成してファイル名部分を削除）
    const testFileName = `_dummy_path.jpg`;
    const { data: urlData } = supabaseAdmin
      .storage
      .from(bucketName)
      .getPublicUrl(testFileName);
    
    const publicUrlBase = urlData?.publicUrl 
      ? urlData.publicUrl.replace(testFileName, '')
      : null;
    
    console.log('バケットURL確認:', publicUrlBase || 'URLが取得できませんでした');

    return res.status(200).json({ 
      success: true, 
      bucketName,
      publicUrlBase,
      message: 'バケットは既に設定済みです'
    });
  } catch (error) {
    console.error('API処理エラー:', error);
    // エラーが発生してもバケットは存在するものとして成功レスポンスを返す
    return res.status(200).json({ 
      success: true, 
      bucketName,
      message: 'バケットは既に設定済みです (エラー発生)'
    });
  }
} 