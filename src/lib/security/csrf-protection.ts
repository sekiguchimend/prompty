import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

interface CSRFConfig {
  secret: string;
  cookieName?: string;
  headerName?: string;
  sameSite?: boolean | 'lax' | 'strict' | 'none';
  secure?: boolean;
}

export class CSRFProtection {
  private config: Required<CSRFConfig>;

  constructor(config: CSRFConfig) {
    this.config = {
      cookieName: '__Host-csrf-token',
      headerName: 'x-csrf-token',
      sameSite: 'strict',
      secure: true,
      ...config
    };
  }

  generateToken(sessionId: string): string {
    const timestamp = Date.now().toString();
    const data = `${sessionId}:${timestamp}`;
    const hmac = crypto.createHmac('sha256', this.config.secret);
    hmac.update(data);
    const signature = hmac.digest('hex');
    
    return Buffer.from(`${data}:${signature}`).toString('base64url');
  }

  validateToken(token: string, sessionId: string): boolean {
    try {
      const decoded = Buffer.from(token, 'base64url').toString();
      const [receivedSessionId, timestamp, signature] = decoded.split(':');
      
      if (receivedSessionId !== sessionId) {
        return false;
      }

      // トークンの有効期限チェック（1時間）
      const tokenTime = parseInt(timestamp);
      if (Date.now() - tokenTime > 60 * 60 * 1000) {
        return false;
      }

      // 署名検証
      const data = `${receivedSessionId}:${timestamp}`;
      const hmac = crypto.createHmac('sha256', this.config.secret);
      hmac.update(data);
      const expectedSignature = hmac.digest('hex');
      
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch {
      return false;
    }
  }

  middleware() {
    return (handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) => {
      return async (req: NextApiRequest, res: NextApiResponse) => {
        // GET、HEAD、OPTIONSは除外
        if (['GET', 'HEAD', 'OPTIONS'].includes(req.method || '')) {
          return handler(req, res);
        }

        // CSRFトークンの検証
        const token = req.headers[this.config.headerName] as string;
        const sessionId = req.headers['authorization']?.replace('Bearer ', '') || 'anonymous';

        if (!token || !this.validateToken(token, sessionId)) {
          return res.status(403).json({
            error: 'CSRF token validation failed',
            code: 'csrf_token_invalid'
          });
        }

        return handler(req, res);
      };
    };
  }
}

// デフォルトのCSRF保護インスタンス
const csrfSecret = process.env.CSRF_SECRET || crypto.randomBytes(32).toString('hex');
export const csrfProtection = new CSRFProtection({
  secret: csrfSecret
});

// CSRF保護ミドルウェア
export const withCSRFProtection = csrfProtection.middleware();

// CSRFトークン生成エンドポイント用ヘルパー
export function generateCSRFToken(sessionId: string): string {
  return csrfProtection.generateToken(sessionId);
}