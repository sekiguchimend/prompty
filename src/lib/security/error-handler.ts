import { NextApiResponse } from 'next';

export interface ApiError {
  statusCode: number;
  message: string;
  code?: string;
  details?: any;
}

export class SecurityError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(message: string, statusCode: number = 400, code?: string, details?: any) {
    super(message);
    this.name = 'SecurityError';
    this.statusCode = statusCode;
    this.code = code || 'SECURITY_ERROR';
    this.details = details;
  }
}

export class ValidationError extends SecurityError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends SecurityError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends SecurityError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class RateLimitError extends SecurityError {
  constructor(message: string = 'Rate limit exceeded', retryAfter?: number) {
    super(message, 429, 'RATE_LIMIT_ERROR', { retryAfter });
    this.name = 'RateLimitError';
  }
}

export class FileUploadError extends SecurityError {
  constructor(message: string, details?: any) {
    super(message, 400, 'FILE_UPLOAD_ERROR', details);
    this.name = 'FileUploadError';
  }
}

// Safe error response that doesn't leak sensitive information
export const createSafeErrorResponse = (error: any): ApiError => {
  // Default error response
  let response: ApiError = {
    statusCode: 500,
    message: 'Internal server error',
    code: 'INTERNAL_ERROR'
  };

  // Handle known error types
  if (error instanceof SecurityError) {
    response = {
      statusCode: error.statusCode,
      message: error.message,
      code: error.code,
      details: error.details
    };
  } else if (error instanceof Error) {
    // For development, include more details
    if (process.env.NODE_ENV === 'development') {
      response.details = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    }
    
    // Handle specific error patterns
    if (error.message.includes('duplicate key')) {
      response = {
        statusCode: 409,
        message: 'Resource already exists',
        code: 'DUPLICATE_RESOURCE'
      };
    } else if (error.message.includes('not found')) {
      response = {
        statusCode: 404,
        message: 'Resource not found',
        code: 'NOT_FOUND'
      };
    } else if (error.message.includes('permission denied')) {
      response = {
        statusCode: 403,
        message: 'Permission denied',
        code: 'PERMISSION_DENIED'
      };
    }
  }

  return response;
};

// Error handler middleware
export const handleApiError = (error: any, res: NextApiResponse) => {
  const errorResponse = createSafeErrorResponse(error);
  
  // Log error for monitoring (but don't expose in response)
  console.error('API Error:', {
    timestamp: new Date().toISOString(),
    error: error.message,
    stack: error.stack,
    statusCode: errorResponse.statusCode
  });

  // Set appropriate headers
  if (error instanceof RateLimitError && error.details?.retryAfter) {
    res.setHeader('Retry-After', error.details.retryAfter);
  }

  return res.status(errorResponse.statusCode).json({
    error: errorResponse.message,
    code: errorResponse.code,
    ...(errorResponse.details && { details: errorResponse.details })
  });
};

// Async error wrapper for API routes
export const withErrorHandler = (
  handler: (req: any, res: NextApiResponse) => Promise<void>
) => {
  return async (req: any, res: NextApiResponse) => {
    try {
      await handler(req, res);
    } catch (error) {
      handleApiError(error, res);
    }
  };
};

// Input sanitization
export const sanitizeInput = (input: any): any => {
  if (typeof input === 'string') {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
};

// CORS configuration
export const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
    ? process.env.NEXT_PUBLIC_URL || 'https://prompty-ai.com'
    : '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400', // 24 hours
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};

// Apply security headers
export const withSecurityHeaders = (res: NextApiResponse) => {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
};

export default {
  SecurityError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  RateLimitError,
  FileUploadError,
  createSafeErrorResponse,
  handleApiError,
  withErrorHandler,
  sanitizeInput,
  withSecurityHeaders
};