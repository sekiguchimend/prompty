import { z } from 'zod';

// 🔒 セキュア版: DOMPurifyなしの安全なサニタイゼーション
export const sanitizeString = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // 1. 基本的な長さ制限
  if (input.length > 10000) {
    input = input.substring(0, 10000);
  }

  // 2. 危険な文字・パターンを除去
  return input
    // HTMLタグの完全除去
    .replace(/<[^>]*>/g, '')
    // JavaScript URLの除去
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    // イベントハンドラーの除去
    .replace(/on\w+\s*=/gi, '')
    // CSS expressionの除去
    .replace(/expression\s*\(/gi, '')
    // SQLインジェクション対策
    .replace(/['";\\]/g, '')
    // 制御文字の除去
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, '')
    // 複数の空白を1つに
    .replace(/\s+/g, ' ')
    .trim();
};

// 🔒 セキュア版: HTMLを許可する場合の安全なサニタイゼーション
export const sanitizeHtml = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // 許可するHTMLタグのみ残す
  const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote'];
  
  return input
    // 危険なタグを除去
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/<object[^>]*>.*?<\/object>/gi, '')
    .replace(/<embed[^>]*>/gi, '')
    .replace(/<form[^>]*>.*?<\/form>/gi, '')
    .replace(/<input[^>]*>/gi, '')
    .replace(/<button[^>]*>.*?<\/button>/gi, '')
    // 危険な属性を除去
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/style\s*=\s*["'][^"']*["']/gi, '')
    .replace(/class\s*=\s*["'][^"']*["']/gi, '')
    .replace(/id\s*=\s*["'][^"']*["']/gi, '')
    // JavaScript URLの除去
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .trim();
};

// 🔒 セキュア版: 検索クエリのサニタイゼーション
export const sanitizeSearchQuery = (query: string): string => {
  if (!query || typeof query !== 'string') {
    return '';
  }

  return query
    // 安全な文字のみ許可（日本語、英数字、スペース、ハイフン）
    .replace(/[^\w\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u0020\u002D]/g, '')
    // 連続する空白を1つに
    .replace(/\s+/g, ' ')
    // SQLインジェクション対策
    .replace(/['"`;\\]/g, '')
    .trim()
    .slice(0, 100);
};

// 🔒 セキュア版: ファイル名のバリデーション
export const sanitizeFilename = (filename: string): string => {
  if (!filename || typeof filename !== 'string') {
    throw new Error('Invalid filename');
  }

  const sanitized = filename
    // 危険な文字の除去
    .replace(/[^a-zA-Z0-9._-]/g, '')
    // パストラバーサル攻撃の防止
    .replace(/\.\./g, '')
    .replace(/^\./, '') // 隠しファイルの防止
    .trim();

  if (sanitized.length < 1 || sanitized.length > 100) {
    throw new Error('Filename length must be between 1 and 100 characters');
  }

  // 危険な拡張子のチェック
  const dangerousExtensions = [
    '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
    '.php', '.asp', '.jsp', '.py', '.rb', '.pl', '.sh', '.htaccess'
  ];

  const lowerFilename = sanitized.toLowerCase();
  for (const ext of dangerousExtensions) {
    if (lowerFilename.endsWith(ext)) {
      throw new Error(`File extension ${ext} is not allowed`);
    }
  }

  return sanitized;
};

// 🔒 セキュア版: プロンプト作成バリデーション
export const createPromptSchema = z.object({
  title: z.string()
    .min(3, 'タイトルは3文字以上必要です')
    .max(200, 'タイトルは200文字以下にしてください')
    .transform(sanitizeString)
    .refine((val) => val.length >= 3, {
      message: 'サニタイゼーション後のタイトルが短すぎます'
    }),
  
  description: z.string()
    .max(1000, '説明は1000文字以下にしてください')
    .transform(sanitizeString)
    .optional()
    .default(''),
    
  content: z.string()
    .min(10, 'コンテンツは10文字以上必要です')
    .max(50000, 'コンテンツは50000文字以下にしてください')
    .transform(sanitizeHtml)
    .refine((val) => val.length >= 10, {
      message: 'サニタイゼーション後のコンテンツが短すぎます'
    }),
    
  category_id: z.string()
    .uuid('無効なカテゴリIDです')
    .optional()
    .nullable(),
  
  is_public: z.boolean().default(true),
  
  is_premium: z.boolean().default(false),
  
  price: z.number()
    .min(0, '価格は0以上にしてください')
    .max(10000, '価格は10000以下にしてください')
    .int('価格は整数である必要があります')
    .default(0),
});

// 🔒 セキュア版: 検索クエリバリデーション
export const searchQuerySchema = z.object({
  query: z.string()
    .min(1, '検索クエリは必須です')
    .max(100, '検索クエリは100文字以下にしてください')
    .transform(sanitizeSearchQuery)
    .refine((val) => val.length >= 1, {
      message: 'サニタイゼーション後の検索クエリが空です'
    }),
    
  category: z.string()
    .uuid('無効なカテゴリIDです')
    .optional(),
  
  page: z.number()
    .min(1, 'ページ番号は1以上である必要があります')
    .max(1000, 'ページ番号は1000以下である必要があります')
    .int('ページ番号は整数である必要があります')
    .default(1),
    
  limit: z.number()
    .min(1, '表示件数は1以上である必要があります')
    .max(50, '表示件数は50以下である必要があります') // 100 → 50に削減
    .int('表示件数は整数である必要があります')
    .default(20),
});

// 🔒 セキュア版: ユーザープロフィール更新バリデーション
export const updateProfileSchema = z.object({
  display_name: z.string()
    .max(50, '表示名は50文字以下にしてください')
    .transform(sanitizeString)
    .refine((val) => !val.includes('admin') && !val.includes('moderator'), {
      message: '表示名に予約語は使用できません'
    })
    .optional(),
    
  bio: z.string()
    .max(500, '自己紹介は500文字以下にしてください')
    .transform(sanitizeHtml)
    .optional(),
    
  location: z.string()
    .max(100, '場所は100文字以下にしてください')
    .transform(sanitizeString)
    .optional(),

  website: z.string()
    .url('有効なURLを入力してください')
    .refine((url) => {
      // 安全なプロトコルのみ許可
      return url.startsWith('https://') || url.startsWith('http://');
    }, {
      message: 'HTTPまたはHTTPSのURLのみ許可されています'
    })
    .optional(),
});

// 🔒 セキュア版: CSRF トークン検証
export const validateCsrfToken = (token: string, sessionToken: string): boolean => {
  if (!token || !sessionToken || typeof token !== 'string' || typeof sessionToken !== 'string') {
    return false;
  }

  try {
    // より安全なCSRFトークン検証（ハッシュベース）
    const crypto = require('crypto');
    const expectedToken = crypto
      .createHash('sha256')
      .update(sessionToken + process.env.CSRF_SECRET)
      .digest('hex')
      .substring(0, 32);
    
    return crypto.timingSafeEqual(
      Buffer.from(token, 'hex'),
      Buffer.from(expectedToken, 'hex')
    );
  } catch (error) {
    return false;
  }
};

// 🔒 セキュア版: ファイルアップロードバリデーション
export const fileUploadSchema = z.object({
  filename: z.string()
    .transform(sanitizeFilename),
    
  mimetype: z.enum([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ], {
    errorMap: () => ({ message: 'サポートされていないファイル形式です' })
  }),
  
  size: z.number()
    .max(10 * 1024 * 1024 * 1024, 'ファイルサイズは10GB以下にしてください') // 動画対応で10GBに設定
    .min(1, 'ファイルサイズが無効です'),

  // 🔒 追加: ファイルのMagic Numberチェック
  buffer: z.instanceof(Buffer).optional(),
}).refine(async (data) => {
  // ファイルの実際の形式をMagic Numberで検証
  if (data.buffer) {
    const magicNumbers = {
      'image/jpeg': [0xFF, 0xD8, 0xFF],
      'image/png': [0x89, 0x50, 0x4E, 0x47],
      'image/gif': [0x47, 0x49, 0x46],
      'image/webp': [0x52, 0x49, 0x46, 0x46],
      'video/mp4': [0x00, 0x00, 0x00],
      'video/webm': [0x1A, 0x45, 0xDF, 0xA3],
      'video/quicktime': [0x00, 0x00, 0x00, 0x14]
    };

    const magic = magicNumbers[data.mimetype as keyof typeof magicNumbers];
    if (magic) {
      const bufferStart = Array.from(data.buffer.slice(0, magic.length));
      const isValid = magic.every((byte, index) => byte === bufferStart[index]);
      if (!isValid) {
        return false;
      }
    }
  }
  return true;
}, {
  message: 'ファイルの実際の形式が申告された形式と一致しません'
});

// 🔒 セキュア版: SQL/NoSQLインジェクション防止
export const sanitizeForDatabase = (input: any): any => {
  if (typeof input === 'string') {
    return input
      .replace(/['";\\]/g, '') // SQL特殊文字の除去
      .replace(/\$\{.*\}/g, '') // テンプレートリテラルの除去
      .replace(/\${.*}/g, '') // NoSQLインジェクション対策
      .trim();
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      // キー名のサニタイゼーション
      const cleanKey = key.replace(/[^a-zA-Z0-9_]/g, '');
      if (cleanKey.length > 0) {
        sanitized[cleanKey] = sanitizeForDatabase(value);
      }
    }
    return sanitized;
  }
  
  return input;
};

export type CreatePromptInput = z.infer<typeof createPromptSchema>;
export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type FileUploadInput = z.infer<typeof fileUploadSchema>;