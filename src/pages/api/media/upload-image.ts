import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabaseAdminClient';
import formidable from 'formidable';
import fs from 'fs';
import { ensureFileExtension } from '../../../lib/security/validation';

// FormDataのパースを有効にする
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // フォームデータをパース
    const form = formidable({ 
      multiples: false,
      keepExtensions: true,
    });
    
    const formData = await new Promise<{ fields: formidable.Fields, files: formidable.Files }>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve({ fields, files });
      });
    });

    const { fields, files } = formData;
    
    // ファイルの取得
    const uploadedFile = files.file;
    const file = Array.isArray(uploadedFile) ? uploadedFile[0] : uploadedFile;
    
    // バケット名の取得
    const bucketName = fields.bucketName ? 
      Array.isArray(fields.bucketName) ? fields.bucketName[0] : fields.bucketName : 'prompt-thumbnails';
    
    if (!file || !file.filepath) {
      return res.status(400).json({ error: 'ファイルが提供されていません' });
    }
    
    
    // ファイル名の生成（日本語対応）
    const originalName = file.originalFilename || 'uploaded_file';
    const mimeType = file.mimetype || 'image/jpeg';
    
    // 日本語ファイル名に対応し、拡張子を確保
    const cleanedName = ensureFileExtension(originalName, mimeType);
    const timestamp = Date.now();
    const fileName = `${timestamp}_${cleanedName}`;
    
    // ファイルバッファを読み込む
    const fileBuffer = fs.readFileSync(file.filepath);
    
    // バケットが存在するか確認し、存在しなければ作成
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();
    
    if (bucketsError) {
      return res.status(500).json({ 
        error: 'ストレージバケットの確認に失敗しました', 
        details: bucketsError 
      });
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      const { error: createBucketError } = await supabaseAdmin.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 40 * 1024 * 1024 * 1024 // 40GB
      });
      
      if (createBucketError) {
        return res.status(500).json({ 
          error: `バケット '${bucketName}' の作成に失敗しました`, 
          details: createBucketError 
        });
      }
    }
    
    // アップロード
    const { data, error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(fileName, fileBuffer, {
        contentType: file.mimetype || 'image/jpeg',
        cacheControl: '3600',
        upsert: true
      });
      
    if (uploadError) {
      return res.status(500).json({ 
        error: 'ファイルのアップロードに失敗しました', 
        details: uploadError 
      });
    }
    
    
    // 公開URLを取得
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(data.path);
      
    // URLパスの検証と修正
    let finalPublicUrl = publicUrl;
    if (!finalPublicUrl.includes('/object/public/')) {
      // 不足している「/public/」を挿入
      finalPublicUrl = finalPublicUrl.replace('/object/', '/object/public/');
    }

    return res.status(200).json({ 
      success: true, 
      message: 'ファイルのアップロードに成功しました',
      publicUrl: finalPublicUrl,
      path: data.path
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
    return res.status(500).json({ error: `画像アップロード中にエラーが発生しました: ${errorMessage}` });
  }
} 