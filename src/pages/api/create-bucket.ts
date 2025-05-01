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
    console.log(`バケット '${bucketName}' の確認/作成を実行します`);
    
    // バケットが存在するかチェック
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    
    if (listError) {
      throw new Error(`バケット一覧の取得に失敗しました: ${listError.message}`);
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    // バケットが存在しない場合は作成
    if (!bucketExists) {
      console.log(`バケット '${bucketName}' が存在しないため作成します`);
      
      const { data, error: createError } = await supabaseAdmin.storage.createBucket(bucketName, {
        public: true, // 公開アクセスを許可
        fileSizeLimit: 5 * 1024 * 1024, // 5MBまで
      });
      
      if (createError) {
        throw new Error(`バケットの作成に失敗しました: ${createError.message}`);
      }
      
      console.log(`バケット '${bucketName}' を作成しました（公開アクセス設定済み）`);
    } else {
      console.log(`バケット '${bucketName}' は既に存在します`);
    }

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
      message: bucketExists ? 'バケットは既に存在します' : 'バケットを新規作成しました'
    });
  } catch (error) {
    console.error('API処理エラー:', error);
    return res.status(500).json({ 
      success: false, 
      bucketName,
      error: error instanceof Error ? error.message : 'バケット操作中に不明なエラーが発生しました',
      message: 'バケットの操作に失敗しました'
    });
  }
} 