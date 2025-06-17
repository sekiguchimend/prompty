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
    
    // MP4 シグネチャをチェック
    if (buffer.length > 8) {
      // ftyp box を探す
      if (buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70) {
        return 'video/mp4';
      }
    }
    
    // WebM シグネチャをチェック
    if (buffer.length > 4) {
      // EBML header
      if (buffer[0] === 0x1A && buffer[1] === 0x45 && buffer[2] === 0xDF && buffer[3] === 0xA3) {
        return 'video/webm';
      }
    }
    
    // AVI シグネチャをチェック
    if (buffer.length > 8) {
      // RIFF header + AVI
      if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
          buffer[8] === 0x41 && buffer[9] === 0x56 && buffer[10] === 0x49 && buffer[11] === 0x20) {
        return 'video/avi';
      }
    }
  }
  
  // ファイル拡張子から推測（上記の検出に失敗した場合）
  const mimeType = getMimeTypeFromExt(originalExt);
  if (mimeType && (mimeType.startsWith('image/') || mimeType.startsWith('video/'))) {
    return mimeType;
  }
  
  // 拡張子から推測
  const ext = originalExt.toLowerCase();
  const extensionMapping: { [key: string]: string } = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'mov': 'video/quicktime',
    'avi': 'video/avi',
    'm4v': 'video/m4v',
    'ogv': 'video/ogg',
    'ogg': 'video/ogg',
    '3gp': 'video/3gpp',
    'flv': 'video/x-flv',
    'wmv': 'video/x-ms-wmv',
    'mkv': 'video/mkv'
  };
  
  if (extensionMapping[ext]) {
    return extensionMapping[ext];
  }
  
  // デフォルトはJPEG
  return 'image/jpeg';
}

// バケットの存在確認のみを行う関数（作成は行わない）
async function ensureBucketExists(supabase: SupabaseClient) {
  try {
    
    // バケットが既に存在するという前提で処理を進める
    // 念のため存在確認のみ行うが、ない場合もエラーとはしない
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        // エラーがあっても続行
      } else {
        const bucketExists = buckets?.some(bucket => bucket.name === 'prompt-thumbnails');
      }
    } catch (checkError) {
      // 確認エラーでも処理を続行
    }
    
    return true;
  } catch (error) {
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
      
      try {
        // サービスロールキーを使用してユーザーを認証
        const adminSupabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        
        // JWTトークンからユーザー情報を取得
        const { data: userData, error: userError } = await adminSupabase.auth.getUser(sessionToken);
        if (userError || !userData.user) {
          return res.status(401).json({ 
            error: '認証エラー', 
            details: 'ユーザー情報の取得に失敗しました' 
          });
        }
        
        supabase = adminSupabase; // 以降の処理でサービスロールクライアントを使用
        
      } catch (authError) {
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
      keepExtensions: true,
      maxFileSize: 40 * 1024 * 1024 * 1024 // 40GB制限（標準アップロードの上限）
    });
    
    const formData = await new Promise<{ fields: formidable.Fields, files: formidable.Files }>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve({ fields, files });
      });
    });

    const { files } = formData;

    // サムネイル画像・動画が提供されていれば処理
    const thumbnail = files.thumbnailImage;
    const thumbnailFile = Array.isArray(thumbnail) ? thumbnail[0] : thumbnail;
    
    if (!thumbnailFile || !thumbnailFile.filepath) {
      return res.status(400).json({ error: 'サムネイル画像・動画が提供されていません' });
    }

    try {
      
      // ファイル名と拡張子の設定
      const originalExt = path.extname(thumbnailFile.originalFilename || '').substring(1) || 'jpg';
      const timestamp = Date.now();
      const fileName = `thumbnail-${timestamp}.${originalExt}`;

      // ファイルを読み込む
      const fileBuffer = fs.readFileSync(thumbnailFile.filepath);
      
      // ファイルの実際の内容からMIMEタイプを検出（より信頼性の高い方法）
      const detectedMimeType = detectMimeType(fileBuffer, originalExt);
      
      // formidableが検出したMIMEタイプ（信頼性が低い場合があるため参考情報）
      
      // 最終的に使用するMIMEタイプ（検出されたものを優先、次にformidable、最後にデフォルト）
      const contentType = detectedMimeType || thumbnailFile.mimetype || 'image/jpeg';
      const mediaTypeText = contentType.startsWith('video/') ? '動画' : '画像';
      
      // MIMEタイプが画像または動画でない場合は拒否
      const isImage = contentType.startsWith('image/');
      const isVideo = contentType.startsWith('video/');
      
      if (!isImage && !isVideo) {
        return res.status(400).json({ 
          error: '無効なファイル形式です。画像または動画ファイルのみアップロード可能です。', 
          detectedType: contentType 
        });
      }

      // バケットの存在確認
      await ensureBucketExists(supabase);

      // アップロード直前に認証の状態をログに出力
      try {
        const { data: authData } = await supabase.auth.getSession();
        if (!authData.session || !authData.session.user) {
          
          // 管理者クライアントを使用してアップロードを試みる
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
            return res.status(500).json({ 
              error: 'サムネイル画像のアップロードに失敗しました', 
              details: adminUploadError.message
            });
          }
          
          
          // 公開URLを取得
          const { data: { publicUrl } } = adminSupabase.storage
            .from('prompt-thumbnails')
            .getPublicUrl(fileName);
            
          
          // URLパスの修正（必要に応じて）
          let finalPublicUrl = publicUrl;
          if (!finalPublicUrl.includes('/object/public/')) {
            finalPublicUrl = finalPublicUrl.replace('/object/', '/object/public/');
          }
          
          // 結果を返す
          return res.status(200).json({
            success: true,
            publicUrl: finalPublicUrl,
            mimeType: contentType,
            mediaType: isVideo ? 'video' : 'image'
          });
        } else {
        }
      } catch (authCheckError) {
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


      // 公開URLを取得
      const { data: { publicUrl } } = supabase.storage
        .from('prompt-thumbnails')
        .getPublicUrl(fileName);

      console.log('公開URL:', publicUrl);

      // URLパスの修正（必要に応じて）
      let finalPublicUrl = publicUrl;
      if (!finalPublicUrl.includes('/object/public/')) {
        finalPublicUrl = finalPublicUrl.replace('/object/', '/object/public/');
      }

      // 結果を返す
      return res.status(200).json({
        success: true,
        publicUrl: finalPublicUrl,
        mimeType: contentType,
        mediaType: isVideo ? 'video' : 'image'
      });
      
    } catch (uploadError: any) {
      return res.status(500).json({ 
        error: 'サムネイル画像の処理中にエラーが発生しました', 
        details: uploadError.message 
      });
    }
  } catch (error: any) {
    return res.status(500).json({ 
      error: '予期せぬエラーが発生しました', 
      message: error.message || 'Unknown error'
    });
  }
}