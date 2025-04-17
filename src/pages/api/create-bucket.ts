import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // POSTリクエスト以外は許可しない
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { bucketName } = req.body;
    
    if (!bucketName) {
      return res.status(400).json({ error: 'bucketNameは必須です' });
    }
    
    console.log('📦 バケット作成リクエスト:', bucketName);
    
    // Supabaseクライアントの初期化（サービスロールキーを使用）
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    if (!supabaseServiceKey) {
      console.error('❌ サービスロールキーが設定されていません');
      return res.status(500).json({ 
        error: 'サーバー設定エラー',
        message: 'サービスロールキーが設定されていません'
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // バケットの存在チェック
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ バケット一覧取得エラー:', listError);
      return res.status(500).json({ 
        error: 'バケット一覧の取得に失敗しました',
        message: listError.message
      });
    }
    
    const bucketExists = buckets?.some(b => b.name === bucketName);
    
    // バケットが既に存在する場合
    if (bucketExists) {
      console.log('✅ バケットは既に存在します:', bucketName);
      
      // バケットを公開に設定
      try {
        const { error: updateError } = await supabase.storage.updateBucket(bucketName, {
          public: true,
        });
        
        if (updateError) {
          console.error('⚠️ バケット公開設定エラー:', updateError);
        } else {
          console.log('✅ バケットを公開に設定しました:', bucketName);
        }
      } catch (updateErr) {
        console.error('⚠️ バケット更新例外:', updateErr);
      }
      
      return res.status(200).json({
        success: true,
        message: 'バケットは既に存在します',
        bucket: bucketName
      });
    }
    
    // バケットを作成
    console.log('🔄 バケット作成中:', bucketName);
    const { data, error } = await supabase.storage.createBucket(bucketName, {
      public: true
    });
    
    if (error) {
      console.error('❌ バケット作成エラー:', error);
      return res.status(500).json({ 
        error: 'バケットの作成に失敗しました',
        message: error.message
      });
    }
    
    console.log('✅ バケット作成成功:', bucketName);
    
    // バケットが正しく公開設定されているか確認
    try {
      const { error: updateError } = await supabase.storage.updateBucket(bucketName, {
        public: true,
      });
      
      if (updateError) {
        console.error('⚠️ バケット公開設定エラー:', updateError);
      } else {
        console.log('✅ バケットを公開に設定しました:', bucketName);
      }
    } catch (updateErr) {
      console.error('⚠️ バケット更新例外:', updateErr);
    }
    
    return res.status(201).json({
      success: true,
      message: 'バケットが正常に作成されました',
      bucket: bucketName
    });
    
  } catch (err) {
    console.error('🔴 サーバーエラー:', err);
    return res.status(500).json({ 
      error: '予期しないエラーが発生しました',
      message: err instanceof Error ? err.message : 'Unknown error'
    });
  }
} 