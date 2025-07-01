import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabaseAdminClient';
import formidable from 'formidable';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { withAuth, AuthenticatedRequest } from '../../../lib/security/auth-middleware';
import { withRateLimit, uploadRateLimit } from '../../../lib/security/rate-limiter';
import { withErrorHandler, FileUploadError, withSecurityHeaders } from '../../../lib/security/error-handler';
import { validateRequest, fileUploadSchema, sanitizeFilename, ensureFileExtension } from '../../../lib/security/validation';

// Configuration
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '42949672960'); // 40GB
const ALLOWED_MIME_TYPES = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/ogg,video/avi,video/mov,video/wmv').split(',');
const UPLOAD_DIR = '/tmp/uploads';

// Disable Next.js body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

// 最適化されたウイルススキャン（非同期）
const scanForVirus = async (filePath: string): Promise<boolean> => {
  try {
    const fileBuffer = await fs.readFile(filePath);
    
    // 基本的な悪意のあるパターン検出（最初の1KBのみ）
    const maliciousPatterns = [
      /eval\s*\(/gi,
      /<script/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /onload\s*=/gi,
      /onerror\s*=/gi
    ];
    
    const fileContent = fileBuffer.toString('utf8', 0, Math.min(fileBuffer.length, 1024));
    
    return !maliciousPatterns.some(pattern => pattern.test(fileContent));
  } catch (error) {
    return false; // エラー時は感染とみなす
  }
};

// 最適化されたメディアファイル検証（非同期）
const validateMediaFile = async (filePath: string, mimeType: string): Promise<boolean> => {
  try {
    const buffer = await fs.readFile(filePath, { flag: 'r' });
    const signatures: Record<string, number[][]> = {
      'image/jpeg': [[0xFF, 0xD8, 0xFF]],
      'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
      'image/gif': [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61], [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]],
      'image/webp': [[0x52, 0x49, 0x46, 0x46]],
      'video/mp4': [[0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70]],
      'video/webm': [[0x1A, 0x45, 0xDF, 0xA3]],
      'video/ogg': [[0x4F, 0x67, 0x67, 0x53]],
      'video/avi': [[0x52, 0x49, 0x46, 0x46]],
      'video/mov': [[0x00, 0x00, 0x00, 0x14, 0x66, 0x74, 0x79, 0x70]],
      'video/wmv': [[0x30, 0x26, 0xB2, 0x75, 0x8E, 0x66, 0xCF, 0x11]]
    };
    
    const expectedSignatures = signatures[mimeType];
    if (!expectedSignatures) {
      return true; // 未知のMIMEタイプは許可
    }
    
    return expectedSignatures.some(signature => 
      signature.every((byte, index) => buffer[index] === byte)
    );
  } catch (error) {
    return false;
  }
};

// セキュアファイル名生成（最適化）
const generateSecureFilename = (originalName: string, userId: string, mimeType: string): string => {
  const cleanedName = ensureFileExtension(originalName, mimeType);
  const ext = path.extname(cleanedName).toLowerCase();
  const nameWithoutExt = path.basename(cleanedName, ext);
  
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex');
  const userHash = crypto.createHash('sha256').update(userId).digest('hex').substring(0, 6);
  
  const secureBaseName = `${nameWithoutExt}_${userHash}_${timestamp}_${random}`;
  const maxLength = 255 - ext.length;
  const finalBaseName = secureBaseName.length > maxLength 
    ? secureBaseName.substring(0, maxLength) 
    : secureBaseName;
  
  return `${finalBaseName}${ext}`;
};

// 非同期ディレクトリ作成
const ensureUploadDir = async (): Promise<void> => {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
};

// バケット作成（最適化）
const ensureBucket = async (bucketName: string): Promise<void> => {
  const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();
  
  if (bucketsError) {
    throw new FileUploadError('Storage service unavailable');
  }
  
  const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
  
  if (!bucketExists) {
    const { error: createBucketError } = await supabaseAdmin.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: MAX_FILE_SIZE,
      allowedMimeTypes: ALLOWED_MIME_TYPES
    });
    
    if (createBucketError) {
      throw new FileUploadError(`Failed to create storage bucket: ${createBucketError.message}`);
    }
  }
};

// メインアップロードハンドラー（最適化）
const uploadHandler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  withSecurityHeaders(res);

  if (req.method !== 'POST') {
    throw new FileUploadError('Method not allowed', { allowedMethods: ['POST'] });
  }

  if (!req.user) {
    throw new FileUploadError('Authentication required');
  }

  // アップロードディレクトリ確保
  await ensureUploadDir();

  try {
    const form = formidable({
      multiples: false,
      keepExtensions: true,
      maxFileSize: MAX_FILE_SIZE,
      maxFields: 10,
      maxFieldsSize: 1024,
      uploadDir: UPLOAD_DIR,
      filename: (name, ext, part) => {
        return `temp_${crypto.randomBytes(16).toString('hex')}${ext}`;
      }
    });

    const { fields, files } = await new Promise<{ fields: formidable.Fields, files: formidable.Files }>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          reject(new FileUploadError(`Form parsing failed: ${err.message}`));
          return;
        }
        resolve({ fields, files });
      });
    });
    
    const uploadedFile = files.file;
    const file = Array.isArray(uploadedFile) ? uploadedFile[0] : uploadedFile;
    
    if (!file?.filepath || !file.originalFilename) {
      throw new FileUploadError('No valid file provided');
    }

    if (!file.mimetype || !ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new FileUploadError(`Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`);
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new FileUploadError(`File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024 / 1024}GB`);
    }

    const bucketName = fields.bucketName ? 
      Array.isArray(fields.bucketName) ? fields.bucketName[0] : fields.bucketName : 'prompt-thumbnails';
    
    if (!/^[a-z0-9-]+$/.test(bucketName) || bucketName.length > 63) {
      throw new FileUploadError('Invalid bucket name');
    }

    // 並列でファイル検証とセキュリティチェック
    const [isValidMedia, isClean] = await Promise.all([
      validateMediaFile(file.filepath, file.mimetype),
      scanForVirus(file.filepath)
    ]);

    if (!isValidMedia) {
      await fs.unlink(file.filepath);
      throw new FileUploadError('Invalid file format or corrupted file');
    }

    if (!isClean) {
      await fs.unlink(file.filepath);
      throw new FileUploadError('File failed security scan');
    }

    const secureFilename = generateSecureFilename(file.originalFilename, req.user.id, file.mimetype);
    
    // 並列でファイル読み取りとバケット確保
    const [fileBuffer] = await Promise.all([
      fs.readFile(file.filepath),
      ensureBucket(bucketName)
    ]);
    
    // 一時ファイルクリーンアップ
    await fs.unlink(file.filepath);
    
    // Supabase Storage にアップロード
    const { data, error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(secureFilename, fileBuffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false
      });
      
    if (uploadError) {
      throw new FileUploadError(`Upload failed: ${uploadError.message}`);
    }
    
    // 公開URL取得
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(data.path);
    
    return res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        publicUrl,
        filename: secureFilename,
        size: file.size,
        type: file.mimetype
      }
    });

  } catch (error) {
    // 一時ファイルクリーンアップ（エラー時）
    try {
      const tempFiles = await fs.readdir(UPLOAD_DIR);
      const cleanupPromises = tempFiles
        .filter(f => f.startsWith('temp_'))
        .map(f => fs.unlink(path.join(UPLOAD_DIR, f)).catch(() => {}));
      
      await Promise.all(cleanupPromises);
    } catch (e) {
      // クリーンアップエラーは無視
    }

    throw error;
  }
};

// ミドルウェア適用とエクスポート
export default withRateLimit(
  uploadRateLimit,
  withAuth(
    { requireAuth: true },
    withErrorHandler(uploadHandler)
  )
);