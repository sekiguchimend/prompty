import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

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
    // サービスロールキーを使用してクライアントを初期化
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // バケットが存在するか確認
    const { data: existingBuckets, error: listError } = await supabase
      .storage
      .listBuckets();

    if (listError) {
      console.error('バケット一覧取得エラー:', listError);
      return res.status(500).json({ error: 'バケット一覧の取得に失敗しました' });
    }

    const bucketExists = existingBuckets.some(bucket => bucket.name === bucketName);

    if (!bucketExists) {
      // バケットが存在しない場合は作成
      const { data, error } = await supabase
        .storage
        .createBucket(bucketName, {
          public: true,
          fileSizeLimit: 5242880 // 5MB
        });

      if (error) {
        console.error('バケット作成エラー:', error);
        return res.status(500).json({ error: 'バケットの作成に失敗しました' });
      }

      console.log(`バケット '${bucketName}' を作成しました`);
    } else {
      console.log(`バケット '${bucketName}' は既に存在します`);
    }

    // ポリシーの更新 (オプション)
    const policies = [
      {
        name: `${bucketName}:アップロード`,
        definition: `auth.role() = 'authenticated' AND bucket_id = '${bucketName}'`,
        operation: 'INSERT'
      },
      {
        name: `${bucketName}:閲覧`,
        definition: `bucket_id = '${bucketName}'`,
        operation: 'SELECT'
      }
    ];

    // ポリシーは必要に応じて更新
    // 実際のポリシー設定はマイグレーションスクリプトで行うことを推奨

    return res.status(200).json({ success: true, bucketName });
  } catch (error) {
    console.error('バケット作成処理エラー:', error);
    return res.status(500).json({ error: '予期せぬエラーが発生しました' });
  }
} 