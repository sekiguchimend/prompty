// Security configuration for production deployment

export const SECURITY_CONFIG = {
  // Rate limiting
  RATE_LIMITS: {
    GENERAL: {
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '100'),
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') // 15 minutes
    },
    AUTH: {
      maxRequests: 10,
      windowMs: 15 * 60 * 1000 // 15 minutes
    },
    UPLOAD: {
      maxRequests: 20,
      windowMs: 60 * 60 * 1000 // 1 hour
    },
    PAYMENT: {
      maxRequests: 5,
      windowMs: 60 * 60 * 1000 // 1 hour
    },
    AI: {
      maxRequests: 50,
      windowMs: 60 * 60 * 1000 // 1 hour
    }
  },

  // File upload security
  FILE_UPLOAD: {
    MAX_SIZE: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB
    ALLOWED_TYPES: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp,image/gif').split(','),
    UPLOAD_DIR: process.env.UPLOAD_DIR || '/tmp/uploads',
    VIRUS_SCAN_ENABLED: process.env.VIRUS_SCAN_ENABLED === 'true',
    QUARANTINE_DIR: process.env.QUARANTINE_DIR || '/tmp/quarantine'
  },

  // Authentication
  AUTH: {
    JWT_SECRET: process.env.JWT_SECRET,
    SESSION_TIMEOUT: parseInt(process.env.SESSION_TIMEOUT || '3600000'), // 1 hour
    REFRESH_TOKEN_ROTATION: process.env.REFRESH_TOKEN_ROTATION === 'true',
    MFA_ENABLED: process.env.MFA_ENABLED === 'true',
    PASSWORD_MIN_LENGTH: parseInt(process.env.PASSWORD_MIN_LENGTH || '8'),
    PASSWORD_REQUIRE_SPECIAL: process.env.PASSWORD_REQUIRE_SPECIAL === 'true'
  },

  // CORS
  CORS: {
    ALLOWED_ORIGINS: process.env.NODE_ENV === 'production' 
      ? [process.env.NEXT_PUBLIC_URL || 'https://prompty-ai.com']
      : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    ALLOWED_HEADERS: ['Content-Type', 'Authorization', 'X-Requested-With'],
    CREDENTIALS: true,
    MAX_AGE: 86400 // 24 hours
  },

  // Security headers
  HEADERS: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': process.env.NODE_ENV === 'production' 
      ? 'max-age=31536000; includeSubDomains; preload' 
      : undefined
  },

  // Content Security Policy
  CSP: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Required for Next.js
      "'unsafe-eval'", // Required for development
      'https://js.stripe.com',
      'https://checkout.stripe.com'
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for styled-components
      'https://fonts.googleapis.com'
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com'
    ],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https:',
      process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    ],
    'connect-src': [
      "'self'",
      'https://api.stripe.com',
      'https://checkout.stripe.com',
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      'https://generativelanguage.googleapis.com'
    ],
    'frame-src': [
      'https://js.stripe.com',
      'https://checkout.stripe.com'
    ],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"]
  },

  // Input validation
  VALIDATION: {
    MAX_STRING_LENGTH: 10000,
    MAX_ARRAY_LENGTH: 100,
    MAX_OBJECT_DEPTH: 10,
    SANITIZE_HTML: true,
    STRIP_DANGEROUS_CHARS: true
  },

  // Logging and monitoring
  LOGGING: {
    LEVEL: process.env.LOG_LEVEL || 'info',
    INCLUDE_STACK_TRACE: process.env.NODE_ENV === 'development',
    LOG_REQUESTS: process.env.LOG_REQUESTS === 'true',
    LOG_ERRORS: true,
    LOG_SECURITY_EVENTS: true
  },

  // Database security
  DATABASE: {
    CONNECTION_TIMEOUT: 30000,
    QUERY_TIMEOUT: 60000,
    MAX_CONNECTIONS: parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
    SSL_REQUIRED: process.env.NODE_ENV === 'production',
    RLS_ENABLED: true
  },

  // API security
  API: {
    REQUEST_SIZE_LIMIT: '10mb',
    PARAMETER_LIMIT: 1000,
    REQUIRE_HTTPS: process.env.NODE_ENV === 'production',
    API_KEY_HEADER: 'X-API-Key',
    VERSION_HEADER: 'X-API-Version'
  },

  // Encryption
  ENCRYPTION: {
    ALGORITHM: 'aes-256-gcm',
    KEY_LENGTH: 32,
    IV_LENGTH: 16,
    TAG_LENGTH: 16,
    SALT_ROUNDS: 12
  }
};

// Validate required environment variables
export const validateSecurityConfig = (): string[] => {
  const errors: string[] = [];

  // Check required environment variables
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET'
  ];

  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      errors.push(`Missing required environment variable: ${envVar}`);
    }
  });

  // Validate JWT secret in production
  if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    errors.push('JWT_SECRET is required in production');
  }

  // Validate encryption key in production
  if (process.env.NODE_ENV === 'production' && !process.env.ENCRYPTION_KEY) {
    errors.push('ENCRYPTION_KEY is required in production');
  }

  // Validate URLs
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
    }
  } catch {
    errors.push('Invalid NEXT_PUBLIC_SUPABASE_URL format');
  }

  return errors;
};

// Generate CSP header string
export const generateCSPHeader = (): string => {
  const csp = SECURITY_CONFIG.CSP;
  const directives = Object.entries(csp).map(([directive, sources]) => {
    return `${directive} ${sources.join(' ')}`;
  });
  return directives.join('; ');
};

// Security middleware configuration
export const getSecurityMiddlewareConfig = () => ({
  rateLimits: SECURITY_CONFIG.RATE_LIMITS,
  cors: SECURITY_CONFIG.CORS,
  headers: SECURITY_CONFIG.HEADERS,
  csp: generateCSPHeader(),
  validation: SECURITY_CONFIG.VALIDATION,
  fileUpload: SECURITY_CONFIG.FILE_UPLOAD
});

export default SECURITY_CONFIG;