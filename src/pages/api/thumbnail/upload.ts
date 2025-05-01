import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabaseClient';
import { supabaseAdmin } from '../../../lib/supabaseAdminClient';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { getMimeTypeFromExt } from '../../../utils/file-upload';

// FormDataのパースを有効にする
export const config = {
  api: {
    bodyParser: false,
  },
};

// ファイルの内容からMIMEタイプを推測する関数
function detectMimeType(buffer: Buffer, originalExt: string): string {
  // マジックナンバーを確認
  if (buffer.length > 2) {
    // JPEG シグネチャをチェック
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      return 'image/jpeg';
    }
    
    // PNG シグネチャをチェック
    if (buffer.length > 8 && 
        buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && 
        buffer[3] === 0x47 && buffer[4] === 0x0D && buffer[5] === 0x0A && 
        buffer[6] === 0x1A && buffer[7] === 0x0A) {
      return 'image/png';
    }
    
    // GIF シグネチャをチェック
    if (buffer.length > 6 && 
        buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && 
        buffer[3] === 0x38 && (buffer[4] === 0x39 || buffer[4] === 0x37) && 
        buffer[5] === 0x61) {
      return 'image/gif';
    }
  }
  
  // ファイル拡張子から推測（上記の検出に失敗した場合）
  const mimeType = getMimeTypeFromExt(originalExt);
  if (mimeType && mimeType.startsWith('image/')) {
    return mimeType;
  }
  
  // デフォルトはJPEG
  return 'image/jpeg';
}

// バケットの存在確認と必要に応じた作成を行う関数
async function ensureBucketExists(req: NextApiRequest) {
  // バケット存在確認
  try {
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('バケット一覧取得エラー:', bucketsError.message);
      throw new Error(`ストレージバケットの確認に失敗しました: ${bucketsError.message}`);
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === 'prompt-thumbnails');
    console.log('prompt-thumbnailsバケット存在確認:', bucketExists);
    
    if (!bucketExists) {
      // バケット作成APIを呼び出す
      console.log('バケットが存在しないため作成を試みます');
      const host = req.headers.host || 'localhost:3000';
      const protocol = host.includes('localhost') ? 'http' : 'https';
      const createBucketUrl = `${protocol}://${host}/api/create-thumbnail-bucket`;
      
      console.log(`バケット作成APIを呼び出します: ${createBucketUrl}`);
      
      const response = await fetch(createBucketUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('バケット作成API応答エラー:', response.status, errorText);
        throw new Error(`バケット作成に失敗しました: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('バケット作成API応答:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'バケット作成に失敗しました');
      }
      
      // 再度バケットの存在を確認
      const { data: recheckData, error: recheckError } = await supabase.storage.listBuckets();
      
      if (recheckError) {
        console.error('バケット再確認エラー:', recheckError.message);
        throw new Error(`バケット作成後の確認に失敗しました: ${recheckError.message}`);
      }
      
      const bucketNowExists = recheckData?.some(bucket => bucket.name === 'prompt-thumbnails');
      
      if (!bucketNowExists) {
        console.error('バケット作成後も存在が確認できません');
        throw new Error('バケット作成を試みましたが、確認できませんでした');
      }
      
      console.log('バケット作成確認: prompt-thumbnailsバケットが存在します');
    }
    
    return true;
  } catch (error) {
    console.error('バケット確認/作成エラー:', error);
    throw error;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // POSTリクエスト以外は許可しない
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // クライアントから送信されたCookieのセッショントークンを取得
    const authHeader = req.headers.authorization;
    let sessionToken = '';
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      sessionToken = authHeader.substring(7);
    } else {
      // Cookieからセッショントークンを取得する方法もバックアップとして実装可能
      console.log('認証ヘッダーが見つかりません。匿名アクセスとして処理します。');
    }
    
    // セッショントークンがある場合はセッションを設定
    if (sessionToken) {
      const { error } = await supabase.auth.setSession({
        access_token: sessionToken,
        refresh_token: '',
      });
      
      if (error) {
        console.warn('セッション設定エラー:', error.message);
        // エラーがあっても処理は続行（匿名アクセスとして）
      }
    }

    // フォームデータをパース
    const form = formidable({ 
      multiples: false,
      keepExtensions: true
    });
    
    const formData = await new Promise<{ fields: formidable.Fields, files: formidable.Files }>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve({ fields, files });
      });
    });

    const { files } = formData;

    // サムネイル画像が提供されていれば処理
    const thumbnail = files.thumbnailImage;
    const thumbnailFile = Array.isArray(thumbnail) ? thumbnail[0] : thumbnail;
    
    if (!thumbnailFile || !thumbnailFile.filepath) {
      return res.status(400).json({ error: 'サムネイル画像が提供されていません' });
    }

    try {
      console.log('サムネイルアップロード処理開始:', thumbnailFile.originalFilename);
      
      // ファイル名と拡張子の設定
      const originalExt = path.extname(thumbnailFile.originalFilename || '').substring(1) || 'jpg';
      const timestamp = Date.now();
      const fileName = `thumbnail-${timestamp}.${originalExt}`;

      // ファイルを読み込む
      const fileBuffer = fs.readFileSync(thumbnailFile.filepath);
      console.log('ファイルサイズ:', fileBuffer.length, 'バイト');
      
      // ファイルの実際の内容からMIMEタイプを検出（より信頼性の高い方法）
      const detectedMimeType = detectMimeType(fileBuffer, originalExt);
      console.log('検出されたMIMEタイプ:', detectedMimeType);
      
      // formidableが検出したMIMEタイプ（信頼性が低い場合があるため参考情報）
      console.log('formidableが検出したMIMEタイプ:', thumbnailFile.mimetype);
      
      // 最終的に使用するMIMEタイプ（検出されたものを優先、次にformidable、最後にデフォルト）
      const contentType = detectedMimeType || thumbnailFile.mimetype || 'image/jpeg';
      
      // MIMEタイプが画像でない場合は拒否
      if (!contentType.startsWith('image/')) {
        return res.status(400).json({ 
          error: '無効なファイル形式です。画像ファイルのみアップロード可能です。', 
          detectedType: contentType 
        });
      }

      // バケットの存在確認と必要に応じた作成
      try {
        await ensureBucketExists(req);
      } catch (bucketError: any) {
        console.error('バケット確保エラー:', bucketError);
        return res.status(500).json({ 
          error: 'バケットの確保に失敗しました', 
          details: bucketError.message || '不明なエラー'
        });
      }

      // 新しいサムネイル画像をアップロード
      const { error: uploadError } = await supabase.storage
        .from('prompt-thumbnails')
        .upload(fileName, fileBuffer, {
          contentType: contentType, // 検出したMIMEタイプを明示的に指定
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('アップロードエラー:', uploadError.message);
        return res.status(500).json({ 
          error: 'サムネイル画像のアップロードに失敗しました', 
          details: uploadError.message
        });
      }

      console.log('アップロード成功:', fileName, 'MIMEタイプ:', contentType);

      // アップロード後のファイルのMIMEタイプを確認
      try {
        const { data: fileInfo } = await supabase.storage
          .from('prompt-thumbnails')
          .getPublicUrl(fileName);
          
        console.log('アップロードされたファイルの公開URL:', fileInfo.publicUrl);
      } catch (checkError) {
        console.warn('ファイル情報確認エラー:', checkError);
        // 続行を許可（エラーチェックのみ）
      }

      // 公開URLを取得
      const { data: { publicUrl } } = supabase.storage
        .from('prompt-thumbnails')
        .getPublicUrl(fileName);

      console.log('公開URL:', publicUrl);

      // URLパスの修正（必要に応じて）
      let finalPublicUrl = publicUrl;
      if (!finalPublicUrl.includes('/object/public/')) {
        console.warn('公開URLパスが不正確です。修正を試みます:', finalPublicUrl);
        finalPublicUrl = finalPublicUrl.replace('/object/', '/object/public/');
        console.log('修正後のURL:', finalPublicUrl);
      }

      // 結果を返す
      return res.status(200).json({
        success: true,
        publicUrl: finalPublicUrl,
        mimeType: contentType
      });
    } catch (uploadError: any) {
      console.error('サムネイルアップロード例外:', uploadError);
      return res.status(500).json({ 
        error: 'サムネイル画像の処理中にエラーが発生しました', 
        details: uploadError.message 
      });
    }
  } catch (error: any) {
    console.error('サムネイルアップロードエラー:', error);
    return res.status(500).json({ 
      error: '予期せぬエラーが発生しました', 
      message: error.message || 'Unknown error'
    });
  }
} 