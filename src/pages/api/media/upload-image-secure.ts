import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabaseAdminClient';
import formidable from 'formidable';
import fs from 'fs';
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

// Virus scanning simulation (in production, use a real antivirus service)
const scanForVirus = async (filePath: string): Promise<boolean> => {
  // This is a placeholder. In production, integrate with services like:
  // - ClamAV
  // - VirusTotal API
  // - AWS GuardDuty
  // - Azure Defender
  
  try {
    const fileBuffer = fs.readFileSync(filePath);
    
    // Basic malicious pattern detection
    const maliciousPatterns = [
      /eval\s*\(/gi,
      /<script/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /onload\s*=/gi,
      /onerror\s*=/gi
    ];
    
    const fileContent = fileBuffer.toString('utf8', 0, Math.min(fileBuffer.length, 1024));
    
    for (const pattern of maliciousPatterns) {
      if (pattern.test(fileContent)) {
        return false; // Virus detected
      }
    }
    
    return true; // Clean
  } catch (error) {
    return false; // Assume infected on error
  }
};

// Validate media file (image and video)
const validateMediaFile = async (filePath: string, mimeType: string): Promise<boolean> => {
  try {
    // Check file signature (magic numbers)
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(16); // 16バイトに拡張（動画ファイル用）
    fs.readSync(fd, buffer, 0, 16, 0);
    fs.closeSync(fd);
    
    const signatures: { [key: string]: number[][] } = {
      // 画像ファイル
      'image/jpeg': [[0xFF, 0xD8, 0xFF]],
      'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
      'image/gif': [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61], [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]],
      'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF header
      // 動画ファイル
      'video/mp4': [[0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70]],
      'video/webm': [[0x1A, 0x45, 0xDF, 0xA3]],
      'video/ogg': [[0x4F, 0x67, 0x67, 0x53]],
      'video/avi': [[0x52, 0x49, 0x46, 0x46]], // RIFF（AVIもRIFFベース）
      'video/mov': [[0x00, 0x00, 0x00, 0x14, 0x66, 0x74, 0x79, 0x70]],
      'video/wmv': [[0x30, 0x26, 0xB2, 0x75, 0x8E, 0x66, 0xCF, 0x11]]
    };
    
    const expectedSignatures = signatures[mimeType];
    if (!expectedSignatures) {
      // 知らないMIMEタイプでも一旦許可（将来的な拡張のため）
      return true;
    }
    
    return expectedSignatures.some(signature => 
      signature.every((byte, index) => buffer[index] === byte)
    );
  } catch (error) {
    return false;
  }
};

// Generate secure filename with Japanese support
const generateSecureFilename = (originalName: string, userId: string, mimeType: string): string => {
  // 元のファイル名を日本語対応でサニタイズし、拡張子を確保
  const cleanedName = ensureFileExtension(originalName, mimeType);
  
  // ファイル名から拡張子を分離
  const ext = path.extname(cleanedName).toLowerCase();
  const nameWithoutExt = path.basename(cleanedName, ext);
  
  // セキュリティのためにタイムスタンプとハッシュを追加
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex'); // 短くしてファイル名の長さを抑制
  const userHash = crypto.createHash('sha256').update(userId).digest('hex').substring(0, 6);
  
  // 元のファイル名を保持しつつ、セキュリティ要素を追加
  const secureBaseName = `${nameWithoutExt}_${userHash}_${timestamp}_${random}`;
  
  // 最終的なファイル名の長さを制限（255文字以内）
  const maxLength = 255 - ext.length;
  const finalBaseName = secureBaseName.length > maxLength 
    ? secureBaseName.substring(0, maxLength) 
    : secureBaseName;
  
  return `${finalBaseName}${ext}`;
};

// Main upload handler
const uploadHandler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  // Apply security headers
  withSecurityHeaders(res);

  if (req.method !== 'POST') {
    throw new FileUploadError('Method not allowed', { allowedMethods: ['POST'] });
  }

  if (!req.user) {
    throw new FileUploadError('Authentication required');
  }

  // Ensure upload directory exists
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  try {
    // Parse form data with strict limits
    const form = formidable({
      multiples: false,
      keepExtensions: true,
      maxFileSize: MAX_FILE_SIZE,
      maxFields: 10,
      maxFieldsSize: 1024, // 1KB for metadata
      uploadDir: UPLOAD_DIR,
      filename: (name, ext, part) => {
        // Generate secure temporary filename
        return `temp_${crypto.randomBytes(16).toString('hex')}${ext}`;
      }
    });

    const formData = await new Promise<{ fields: formidable.Fields, files: formidable.Files }>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          reject(new FileUploadError(`Form parsing failed: ${err.message}`));
          return;
        }
        resolve({ fields, files });
      });
    });

    const { fields, files } = formData;
    
    // Get uploaded file
    const uploadedFile = files.file;
    const file = Array.isArray(uploadedFile) ? uploadedFile[0] : uploadedFile;
    
    if (!file || !file.filepath) {
      throw new FileUploadError('No file provided');
    }

    // Validate file properties
    if (!file.originalFilename) {
      throw new FileUploadError('Invalid filename');
    }

    if (!file.mimetype || !ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new FileUploadError(`Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`);
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new FileUploadError(`File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024 / 1024}GB`);
    }

    // Validate bucket name
    const bucketName = fields.bucketName ? 
      Array.isArray(fields.bucketName) ? fields.bucketName[0] : fields.bucketName : 'prompt-thumbnails';
    
    if (!/^[a-z0-9-]+$/.test(bucketName) || bucketName.length > 63) {
      throw new FileUploadError('Invalid bucket name');
    }


    // Validate file signature
    const isValidMedia = await validateMediaFile(file.filepath, file.mimetype);
    if (!isValidMedia) {
      fs.unlinkSync(file.filepath); // Clean up
      throw new FileUploadError('Invalid file format or corrupted file');
    }

    // Scan for viruses
    const isClean = await scanForVirus(file.filepath);
    if (!isClean) {
      fs.unlinkSync(file.filepath); // Clean up
      throw new FileUploadError('File failed security scan');
    }

    // Generate secure filename
    const secureFilename = generateSecureFilename(file.originalFilename, req.user.id, file.mimetype);
    
    // Read file buffer
    const fileBuffer = fs.readFileSync(file.filepath);
    
    // Clean up temporary file
    fs.unlinkSync(file.filepath);

    // Check if bucket exists, create if needed
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
    
    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(secureFilename, fileBuffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false // Don't overwrite existing files
      });
      
    if (uploadError) {
      throw new FileUploadError(`Upload failed: ${uploadError.message}`);
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(data.path);
    
    // Log successful upload for audit

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
    // Clean up any temporary files on error
    try {
      const tempFiles = fs.readdirSync(UPLOAD_DIR).filter(f => f.startsWith('temp_'));
      tempFiles.forEach(f => {
        try {
          fs.unlinkSync(path.join(UPLOAD_DIR, f));
        } catch (e) {
          // Ignore cleanup errors
        }
      });
    } catch (e) {
      // Ignore cleanup errors
    }

    throw error;
  }
};

// Apply middleware and export
export default withRateLimit(
  uploadRateLimit,
  withAuth(
    { requireAuth: true },
    withErrorHandler(uploadHandler)
  )
);