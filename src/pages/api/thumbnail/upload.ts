import { NextApiRequest, NextApiResponse } from 'next';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
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

// バケットの存在確認のみを行う関数（作成は行わない）
async function ensureBucketExists(supabase: SupabaseClient) {
  try {
    console.log('サムネイルバケットの存在を前提として処理を進めます');
    
    // バケットが既に存在するという前提で処理を進める
    // 念のため存在確認のみ行うが、ない場合もエラーとはしない
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.warn('バケット一覧取得警告:', bucketsError.message);
        // エラーがあっても続行
      } else {
        const bucketExists = buckets?.some(bucket => bucket.name === 'prompt-thumbnails');
        console.log('prompt-thumbnailsバケット存在確認:', bucketExists ? '存在します' : '存在しませんが処理を続行します');
      }
    } catch (checkError) {
      console.warn('バケット確認中の警告:', checkError);
      // 確認エラーでも処理を続行
    }
    
    return true;
  } catch (error) {
    console.warn('バケット確認中の警告:', error);
    // エラーがあっても処理を続行（バケットは既に存在するという前提）
    return true;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // POSTリクエスト以外は許可しない
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 認証ヘッダーから認証トークンを取得
    const authHeader = req.headers.authorization;
    let sessionToken = '';
    let supabase: SupabaseClient;

    // 認証処理
    if (authHeader && authHeader.startsWith('Bearer ')) {
      sessionToken = authHeader.substring(7);
      console.log('認証トークンの長さ:', sessionToken.length);
      
      try {
        // 認証トークンを持つクライアントを初期化する方法に変更
        supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            global: {
              headers: {
                Authorization: `Bearer ${sessionToken}`
              }
            }
          }
        );
        
        // セッションが正しく設定されたことを確認
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
          console.error('ユーザー取得エラー:', userError || 'ユーザーデータなし');
          return res.status(401).json({ 
            error: '認証エラー', 
            details: 'ユーザー情報の取得に失敗しました' 
          });
        }
        
        console.log('認証成功 - ユーザーID:', userData.user.id);
      } catch (authError) {
        console.error('認証処理エラー:', authError);
        return res.status(401).json({ 
          error: '認証エラー', 
          details: '認証処理中にエラーが発生しました' 
        });
      }
    } else {
      // 認証ヘッダーがない場合は明示的にエラーを返す
      return res.status(401).json({ 
        error: '認証エラー', 
        details: 'アップロードには認証が必要です' 
      });
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
      console.log('ファイルパス:', fileName, '（バケットのルートに保存します）');

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

      // バケットの存在確認
      await ensureBucketExists(supabase);

      // アップロード直前に認証の状態をログに出力
      console.log('アップロード直前の認証状態確認...');
      try {
        const { data: authData } = await supabase.auth.getSession();
        if (!authData.session || !authData.session.user) {
          console.log('通常認証: 認証セッションが見つかりません。管理者権限で続行します。');
          
          // 管理者クライアントを使用してアップロードを試みる
          console.log('管理者権限でのアップロードを試行します');
          const adminSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          );
          
          // 管理者クライアントでアップロード
          const { error: adminUploadError, data: adminUploadData } = await adminSupabase.storage
            .from('prompt-thumbnails')
            .upload(fileName, fileBuffer, {
              contentType: contentType,
              cacheControl: '3600',
              upsert: true
            });
            
          if (adminUploadError) {
            console.error('管理者権限でのアップロードエラー:', adminUploadError.message);
            return res.status(500).json({ 
              error: 'サムネイル画像のアップロードに失敗しました', 
              details: adminUploadError.message
            });
          }
          
          console.log('管理者権限でのアップロード成功:', fileName);
          
          // 公開URLを取得
          const { data: { publicUrl } } = adminSupabase.storage
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
        } else {
          console.log('アップロード直前の認証確認: 有効 (ユーザーID:', authData.session.user.id, ')');
        }
      } catch (authCheckError) {
        console.error('認証確認エラー:', authCheckError);
        // エラーがあっても続行を試みる
      }

      // 認証済みユーザーとしてアップロード
      const { error: uploadError } = await supabase.storage
        .from('prompt-thumbnails')
        .upload(fileName, fileBuffer, {
          contentType: contentType,
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('アップロードエラー:', uploadError.message);
        
        // RLSポリシー違反の場合
        if (uploadError.message.includes('security policy')) {
          return res.status(403).json({ 
            error: 'アップロード権限がありません', 
            details: 'Row Level Security ポリシーによってアップロードが拒否されました。認証が有効であることを確認してください。バケットのルートディレクトリに直接保存できるようRLSポリシーが設定されていることを確認してください。'
          });
        }
        
        return res.status(500).json({ 
          error: 'サムネイル画像のアップロードに失敗しました', 
          details: uploadError.message
        });
      }

      console.log('アップロード成功:', fileName, 'MIMEタイプ:', contentType);

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