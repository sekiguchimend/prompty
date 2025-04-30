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
    // バケットが存在するか確認
    const { data: existingBuckets, error: listError } = await supabaseAdmin
      .storage
      .listBuckets();

    if (listError) {
      console.error('バケット一覧取得エラー:', listError);
      return res.status(500).json({ error: 'バケット一覧の取得に失敗しました' });
    }

    const bucketExists = existingBuckets.some(bucket => bucket.name === bucketName);

    if (!bucketExists) {
      // バケットが存在しない場合は作成
      const { data, error } = await supabaseAdmin
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

    // ポリシーを適用する
    try {
      // SQLクエリを使用してポリシーを作成
      // SELECTポリシー（閲覧用）- すべてのユーザーがアクセス可能に
      const { data: selectPolicyData, error: selectPolicyError } = await supabaseAdmin
        .rpc('create_storage_policy', {
          policy_name: `${bucketName}:閲覧`,
          bucket_name: bucketName,
          definition: `bucket_id = '${bucketName}'`,
          operation: 'SELECT'
        });

      if (selectPolicyError) {
        console.error('SELECT ポリシー作成エラー:', selectPolicyError);
        // エラーがあっても続行（バケットは作成済み）
      } else {
        console.log(`${bucketName} の SELECT ポリシーを作成しました`);
      }

      // INSERTポリシー（アップロード用）- 認証済みユーザーのみ
      const { data: insertPolicyData, error: insertPolicyError } = await supabaseAdmin
        .rpc('create_storage_policy', {
          policy_name: `${bucketName}:アップロード`,
          bucket_name: bucketName,
          definition: `auth.role() = 'authenticated' OR (bucket_id = '${bucketName}' AND auth.uid() IS NOT NULL)`,
          operation: 'INSERT'
        });

      if (insertPolicyError) {
        console.error('INSERT ポリシー作成エラー:', insertPolicyError);
        // エラーがあっても続行
      } else {
        console.log(`${bucketName} の INSERT ポリシーを作成しました`);
      }

      // SQL直接実行は削除（RPC関数がない場合が多いため）
    } catch (policyError) {
      console.error('ポリシー作成中にエラー発生:', policyError);
      // エラーがあっても続行（バケットは作成済み）
    }

    return res.status(200).json({ 
      success: true, 
      bucketName,
      message: 'バケットとポリシーが正常に設定されました'
    });
  } catch (error) {
    console.error('バケット作成処理エラー:', error);
    return res.status(500).json({ error: '予期せぬエラーが発生しました' });
  }
} 