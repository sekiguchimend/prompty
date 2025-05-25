import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// サービスロールキーを使って直接クライアントを作成（確実に管理者権限を使用）
const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase環境変数が設定されていません');
  }
  
  console.log('管理者クライアント作成: URL設定済み、サービスキー長さ:', supabaseServiceKey.length);
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // POSTリクエスト以外は許可しない
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log(`prompt-thumbnailsバケットの確認/作成を実行します`);
    
    // 環境変数の確認
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase環境変数が設定されていません:', {
        url: supabaseUrl ? '設定済み' : '未設定',
        serviceKey: supabaseServiceKey ? '設定済み' : '未設定'
      });
      return res.status(500).json({ 
        success: false, 
        error: 'Supabase環境変数が正しく設定されていません',
        message: '管理者設定エラー'
      });
    }
    
    console.log('環境変数確認:', {
      url: '設定済み',
      serviceKey: `設定済み（長さ: ${supabaseServiceKey.length}）`
    });
    
    // 直接管理者クライアントを作成（初期化の問題を回避）
    const adminClient = createAdminClient();
    
    // バケットが存在するかチェック（エラーハンドリングを強化）
    let buckets;
    try {
      const { data, error } = await adminClient.storage.listBuckets();
      if (error) {
        throw error;
      }
      buckets = data;
    } catch (listError: any) {
      console.error('バケット一覧取得エラー:', listError);
      return res.status(500).json({ 
        success: false, 
        error: `バケット一覧の取得に失敗しました: ${listError.message}`,
        message: 'ストレージアクセスエラー' 
      });
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === 'prompt-thumbnails');
    
    // バケットが存在しない場合は作成
    if (!bucketExists) {
      console.log(`バケット 'prompt-thumbnails' が存在しないため作成します`);
      
      try {
        const { error: createError } = await adminClient.storage.createBucket('prompt-thumbnails', {
          public: true, // 公開アクセスを許可
          fileSizeLimit: 5 * 1024 * 1024, // 5MBまで
        });
        
        if (createError) {
          console.error('バケット作成エラー:', createError);
          return res.status(500).json({ 
            success: false, 
            error: `バケットの作成に失敗しました: ${createError.message}`,
            message: 'バケット作成エラー' 
          });
        }
        
        console.log(`バケット 'prompt-thumbnails' を作成しました`);
      } catch (createBucketError: any) {
        console.error('バケット作成例外:', createBucketError);
        return res.status(500).json({ 
          success: false, 
          error: `バケット作成中に例外が発生しました: ${createBucketError.message}`,
          message: 'バケット作成エラー' 
        });
      }
      
      // RLSポリシーを設定（パブリックアクセス用）
      try {
        // バケットを公開に設定
        const { error: updateBucketError } = await adminClient.storage.updateBucket('prompt-thumbnails', {
          public: true,
        });
        
        if (updateBucketError) {
          console.error('バケット公開設定エラー:', updateBucketError);
        } else {
          console.log('バケットを公開設定に変更しました');
        }
      } catch (policyError) {
        console.error('ポリシー設定例外:', policyError);
        // ポリシー設定の失敗はバケット作成の成功を妨げないので続行
      }
    } else {
      console.log(`バケット 'prompt-thumbnails' は既に存在します`);
    }

    // 再確認: バケットが確実に存在するか確認（追加のセーフガード）
    try {
      const { data: recheckData, error: recheckError } = await adminClient.storage.listBuckets();
      
      if (recheckError) {
        console.warn('バケット再確認エラー:', recheckError);
      } else {
        const bucketConfirmed = recheckData?.some(bucket => bucket.name === 'prompt-thumbnails');
        if (!bucketConfirmed) {
          console.error('作成後もバケットが確認できません');
          return res.status(500).json({ 
            success: false, 
            error: 'バケット作成後も存在を確認できません',
            message: 'バケット作成確認エラー' 
          });
        }
        console.log('バケット存在確認済み: prompt-thumbnails');
      }
    } catch (recheckError) {
      console.warn('再確認中にエラー:', recheckError);
      // 続行を許可（ベストエフォート）
    }

    // 公開URLのベースを取得
    let publicUrlBase = null;
    try {
      const testFileName = `_dummy_path.jpg`;
      const { data: urlData } = adminClient
        .storage
        .from('prompt-thumbnails')
        .getPublicUrl(testFileName);
      
      publicUrlBase = urlData?.publicUrl 
        ? urlData.publicUrl.replace(testFileName, '')
        : null;
      
      console.log('バケットURL確認:', publicUrlBase || 'URLが取得できませんでした');
    } catch (urlError) {
      console.warn('URL取得エラー:', urlError);
      // 続行を許可
    }

    return res.status(200).json({ 
      success: true, 
      bucketName: 'prompt-thumbnails',
      publicUrlBase,
      message: bucketExists ? 'バケットは既に存在します' : 'バケットを新規作成しました'
    });
  } catch (error) {
    console.error('API処理エラー:', error);
    return res.status(500).json({ 
      success: false, 
      bucketName: 'prompt-thumbnails',
      error: error instanceof Error ? error.message : 'バケット操作中に不明なエラーが発生しました',
      message: 'バケットの操作に失敗しました'
    });
  }
} 