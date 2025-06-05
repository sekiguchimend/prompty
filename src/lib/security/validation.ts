import { z } from 'zod';

// Common validation schemas
export const emailSchema = z.string().email('Invalid email format').max(254);
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters').max(128);
export const uuidSchema = z.string().uuid('Invalid UUID format');
export const urlSchema = z.string().url('Invalid URL format').max(2048);

// File upload validation
export const fileUploadSchema = z.object({
  file: z.object({
    size: z.number().max(5 * 1024 * 1024, 'File size must be less than 5MB'),
    type: z.string().refine(
      (type) => ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(type),
      'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed'
    ),
    name: z.string().max(255, 'Filename too long')
  }),
  bucketName: z.string().regex(/^[a-z0-9-]+$/, 'Invalid bucket name').max(63)
});

// API request validation
export const createPromptSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  content: z.string().min(1, 'Content is required').max(50000, 'Content too long'),
  category: z.string().min(1, 'Category is required').max(50),
  tags: z.array(z.string().max(30)).max(10, 'Too many tags'),
  price: z.number().min(0).max(999999, 'Price too high').optional(),
  isPublic: z.boolean().default(true),
  thumbnailUrl: urlSchema.optional()
});

export const updateProfileSchema = z.object({
  displayName: z.string().min(1, 'Display name is required').max(50),
  bio: z.string().max(500, 'Bio too long').optional(),
  website: urlSchema.optional(),
  avatarUrl: urlSchema.optional()
});

export const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(1000, 'Comment too long'),
  promptId: uuidSchema,
  parentId: uuidSchema.optional()
});

export const reportSchema = z.object({
  targetId: uuidSchema,
  targetType: z.enum(['prompt', 'comment', 'user']),
  reason: z.enum(['spam', 'inappropriate', 'copyright', 'harassment', 'other']),
  description: z.string().max(500, 'Description too long').optional()
});

// Stripe payment validation
export const paymentIntentSchema = z.object({
  promptId: uuidSchema,
  amount: z.number().min(50, 'Minimum amount is $0.50').max(999999, 'Amount too high')
});

// Search validation
export const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(100, 'Query too long'),
  category: z.string().max(50).optional(),
  sortBy: z.enum(['relevance', 'date', 'popularity', 'price']).default('relevance'),
  page: z.number().min(1).max(1000).default(1),
  limit: z.number().min(1).max(50).default(20)
});

// Code generation validation
export const codeGenerationSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(2000, 'Prompt too long'),
  framework: z.enum(['react', 'vue', 'vanilla', 'nextjs', 'svelte', 'auto']).optional(),
  language: z.enum(['javascript', 'typescript', 'auto']).optional(),
  styling: z.enum(['css', 'tailwind', 'styled-components', 'emotion', 'auto']).optional(),
  complexity: z.enum(['simple', 'intermediate', 'advanced', 'auto']).optional(),
  model: z.enum(['gemini-2.0-flash', 'gemini-1.5-pro', 'claude-3.5-sonnet', 'claude-sonnet-4']).optional()
});

// Validation helper function
export const validateRequest = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`Validation failed: ${errorMessages.join(', ')}`);
    }
    throw error;
  }
};

// Sanitization functions
export const sanitizeHtml = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
    .replace(/\.{2,}/g, '.') // Replace multiple dots with single dot
    .substring(0, 255); // Limit length
};

// Rate limiting validation
export const rateLimitSchema = z.object({
  identifier: z.string().min(1).max(100),
  maxRequests: z.number().min(1).max(10000).default(100),
  windowMs: z.number().min(1000).max(3600000).default(900000) // 15 minutes default
});