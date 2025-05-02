import { NextApiRequest, NextApiResponse } from 'next';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { getMimeTypeFromExt } from '../../../utils/file-upload';

// JWTトークンの中身を確認するデバッグ関数
function analyzeJwt(token: string): { header: any; payload: any; isValidFormat: boolean } {
  try {
    // JWTの標準的な形式は「ヘッダー.ペイロード.署名」
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { 
        header: null, 
        payload: null, 
        isValidFormat: false 
      };
    }
    
    // Base64デコード関数（URLセーフなBase64を標準Base64に変換してからデコード）
    const decodeBase64 = (base64Url: string) => {
      try {
        // URLセーフなBase64を標準Base64に変換
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        // パディングを追加（必要な場合）
        const paddedBase64 = base64.padEnd(
          base64.length + (4 - (base64.length % 4)) % 4, 
          '='
        );
        // Base64デコード
        const decoded = Buffer.from(paddedBase64, 'base64').toString();
        return JSON.parse(decoded);
      } catch (e) {
        console.error('JWT部分のデコードに失敗:', e);
        return null;
      }
    };
    
    // ヘッダーとペイロードをデコード
    const header = decodeBase64(parts[0]);
    const payload = decodeBase64(parts[1]);
    
    return {
      header,
      payload,
      isValidFormat: true
    };
  } catch (error) {
    console.error('JWTトークン解析エラー:', error);
    return { 
      header: null, 
      payload: null, 
      isValidFormat: false 
    };
  }
}

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

// サービスロールキーを使用した管理者用のSupabaseクライアントを作成する関数
function createAdminClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase環境変数が設定されていません');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // POSTリクエスト以外は許可しない
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 認証ヘッダーから認証トークンを取得 (ユーザー情報の参照用)
    const authHeader = req.headers.authorization;
    let userId: string | null = null;
    
    // 認証トークンがある場合、ユーザー情報を取得（成功しなくてもアップロードは続行）
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const sessionToken = authHeader.substring(7);
        
        // トークンの詳細情報をデバッグ出力
        const tokenLength = sessionToken.length;
        const tokenStart = sessionToken.substring(0, 20);
        const tokenEnd = sessionToken.substring(tokenLength - 20);
        console.log('サーバーが受信したトークンの詳細：', {
          長さ: tokenLength,
          先頭20文字: tokenStart,
          末尾20文字: tokenEnd,
          ドット数: sessionToken.split('.').length - 1, // JWTは通常2つのドットを含む
          ヘッダー全体の長さ: authHeader.length
        });
        
        // JWTトークンの中身を解析（デバッグ用）
        const jwtAnalysis = analyzeJwt(sessionToken);
        if (jwtAnalysis.isValidFormat) {
          console.log('JWT解析結果:');
          console.log('- ヘッダー:', jwtAnalysis.header);
          console.log('- ペイロード:', {
            ...jwtAnalysis.payload,
            exp: jwtAnalysis.payload?.exp 
              ? `${jwtAnalysis.payload.exp} (${new Date(jwtAnalysis.payload.exp * 1000).toISOString()})` 
              : 'なし'
          });
          
          // 有効期限のチェック
          const now = Math.floor(Date.now() / 1000);
          if (jwtAnalysis.payload?.exp) {
            const isExpired = now > jwtAnalysis.payload.exp;
            console.log(`- 有効期限: ${isExpired ? '期限切れ' : '有効'} (現在時刻: ${now})`);
          } else {
            console.log('- 有効期限: 不明（expフィールドなし）');
          }
        } else {
          console.log('JWT形式ではないか、解析できないトークンです');
        }
        
        console.log('認証トークンの長さ:', sessionToken.length);
        
        // クライアント用のSupabaseインスタンスを作成
        const authClient = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        
        // トークンからユーザー情報を取得
        const { data: userData, error: userError } = await authClient.auth.getUser(sessionToken);
        
        if (userError) {
          console.warn('トークンからのユーザー取得エラー:', userError.message);
        } else if (userData.user) {
          userId = userData.user.id;
          console.log('認証ユーザーID:', userId);
        } else {
          console.warn('トークンからユーザーが取得できませんでした');
        }
      } catch (authError) {
        console.error('認証エラー:', authError);
        // エラーがあっても処理は続行
      }
    }

    // 管理者権限を持つSupabaseクライアントを作成
    let supabase: SupabaseClient;
    try {
      supabase = createAdminClient();
      console.log('管理者クライアント作成成功');
    } catch (adminError) {
      console.error('管理者クライアント作成エラー:', adminError);
      return res.status(500).json({ 
        error: 'サーバー設定エラー', 
        details: '管理者クライアントの作成に失敗しました' 
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
      
      // ファイル名の生成（ユーザーIDが取得できた場合はパスに含める）
      let fileName = `thumbnail-${timestamp}.${originalExt}`;
      if (userId) {
        fileName = `${userId}/${fileName}`;
        console.log('ユーザーIDを含めたファイルパス:', fileName);
      } else {
        console.log('匿名ユーザー用ファイルパス:', fileName);
      }

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
      
      console.log('バケットの存在を確認、管理者権限でアップロード実行');
      
      // 管理者権限でアップロード（RLSポリシーをバイパス）
      const { error: uploadError } = await supabase.storage
        .from('prompt-thumbnails')
        .upload(fileName, fileBuffer, {
          contentType: contentType,
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('アップロードエラー:', uploadError.message);
        
        // アップロードエラーを詳細に分析
        if (uploadError.message.includes('bucket') && uploadError.message.includes('not found')) {
          return res.status(500).json({ 
            error: 'バケットが存在しません', 
            details: 'prompt-thumbnailsバケットを作成してください' 
          });
        } else if (uploadError.message.includes('security policy')) {
          return res.status(500).json({ 
            error: 'セキュリティポリシーエラー', 
            details: '管理者権限でもRLSポリシーをバイパスできませんでした。ポリシー設定を確認してください。' 
          });
        } else {
          return res.status(500).json({ 
            error: 'サムネイル画像のアップロードに失敗しました', 
            details: uploadError.message 
          });
        }
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