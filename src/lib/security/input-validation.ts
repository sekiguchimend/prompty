import { z } from 'zod';

// 基本的な入力検証スキーマ
export const sanitizeString = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // HTMLタグの除去
    .replace(/['";]/g, '') // SQLインジェクション対策
    .trim()
    .slice(0, 1000); // 最大長制限
};

export const sanitizeSearchQuery = (query: string): string => {
  return query
    .replace(/[^\w\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '') // 安全な文字のみ許可
    .trim()
    .slice(0, 100);
};

// プロンプト作成のバリデーション
export const createPromptSchema = z.object({
  title: z.string()
    .min(3, 'タイトルは3文字以上必要です')
    .max(200, 'タイトルは200文字以下にしてください')
    .transform(sanitizeString),
  
  description: z.string()
    .max(1000, '説明は1000文字以下にしてください')
    .transform(sanitizeString)
    .optional()
    .default(''),
    
  content: z.string()
    .min(10, 'コンテンツは10文字以上必要です')
    .max(50000, 'コンテンツは50000文字以下にしてください'),
    
  category_id: z.string().uuid().optional().nullable(),
  
  is_public: z.boolean().default(true),
  
  is_premium: z.boolean().default(false),
  
  price: z.number()
    .min(0, '価格は0以上にしてください')
    .max(10000, '価格は10000以下にしてください')
    .default(0),
});

// 検索クエリのバリデーション
export const searchQuerySchema = z.object({
  query: z.string()
    .min(1, '検索クエリは必須です')
    .max(100, '検索クエリは100文字以下にしてください')
    .transform(sanitizeSearchQuery),
    
  category: z.string().optional(),
  
  page: z.number()
    .min(1)
    .max(1000)
    .default(1),
    
  limit: z.number()
    .min(1)
    .max(100)
    .default(20),
});

// ユーザープロフィール更新のバリデーション
export const updateProfileSchema = z.object({
  display_name: z.string()
    .max(50, '表示名は50文字以下にしてください')
    .transform(sanitizeString)
    .optional(),
    
  bio: z.string()
    .max(500, '自己紹介は500文字以下にしてください')
    .transform(sanitizeString)
    .optional(),
    
  location: z.string()
    .max(100, '場所は100文字以下にしてください')
    .transform(sanitizeString)
    .optional(),
});

// CSRF トークン検証
export const validateCsrfToken = (token: string, sessionToken: string): boolean => {
  // 簡単なCSRFトークン検証（本番環境では暗号化ハッシュを使用）
  const expectedToken = Buffer.from(sessionToken).toString('base64');
  return token === expectedToken;
};

// ファイルアップロード検証
export const fileUploadSchema = z.object({
  filename: z.string()
    .regex(/^[a-zA-Z0-9._-]+$/, '無効なファイル名です')
    .max(255),
    
  mimetype: z.enum([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ], {
    errorMap: () => ({ message: 'サポートされていないファイル形式です' })
  }),
  
  size: z.number()
    .max(5 * 1024 * 1024, 'ファイルサイズは5MB以下にしてください'),
});

export type CreatePromptInput = z.infer<typeof createPromptSchema>;
export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type FileUploadInput = z.infer<typeof fileUploadSchema>;