import { NextApiResponse } from 'next';

export interface SecurityHeadersConfig {
  contentSecurityPolicy?: string;
  strictTransportSecurity?: string;
  xFrameOptions?: string;
  xContentTypeOptions?: string;
  referrerPolicy?: string;
  permissionsPolicy?: string;
}

export const defaultSecurityHeaders: Required<SecurityHeadersConfig> = {
  contentSecurityPolicy: `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://api.anthropic.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: blob: https: ${process.env.NEXT_PUBLIC_SUPABASE_URL};
    connect-src 'self' ${process.env.NEXT_PUBLIC_SUPABASE_URL} https://api.anthropic.com https://api.stripe.com;
    font-src 'self' https://fonts.gstatic.com;
    frame-src 'self' https://js.stripe.com;
    media-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s+/g, ' ').trim(),
  
  strictTransportSecurity: 'max-age=31536000; includeSubDomains; preload',
  xFrameOptions: 'DENY',
  xContentTypeOptions: 'nosniff',
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
};

export function setSecurityHeaders(
  res: NextApiResponse,
  config: SecurityHeadersConfig = {}
): void {
  const headers = { ...defaultSecurityHeaders, ...config };

  res.setHeader('Content-Security-Policy', headers.contentSecurityPolicy);
  res.setHeader('Strict-Transport-Security', headers.strictTransportSecurity);
  res.setHeader('X-Frame-Options', headers.xFrameOptions);
  res.setHeader('X-Content-Type-Options', headers.xContentTypeOptions);
  res.setHeader('Referrer-Policy', headers.referrerPolicy);
  res.setHeader('Permissions-Policy', headers.permissionsPolicy);
  
  // 追加のセキュリティヘッダー
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('X-Download-Options', 'noopen');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
}

// セキュリティヘッダーミドルウェア
export function withSecurityHeaders(config?: SecurityHeadersConfig) {
  return function securityHeadersMiddleware(
    handler: (req: any, res: NextApiResponse) => Promise<void>
  ) {
    return async (req: any, res: NextApiResponse) => {
      setSecurityHeaders(res, config);
      return handler(req, res);
    };
  };
}