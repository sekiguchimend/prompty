import { NextApiRequest, NextApiResponse } from 'next';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (req: NextApiRequest) => string;
  skipFailedRequests?: boolean;
  skipSuccessfulRequests?: boolean;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
}

class EnhancedRateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      keyGenerator: (req) => this.getClientIP(req),
      skipFailedRequests: false,
      skipSuccessfulRequests: false,
      ...config
    };

    // クリーンアップタイマー
    setInterval(() => this.cleanup(), this.config.windowMs);
  }

  private getClientIP(req: NextApiRequest): string {
    return (
      req.headers['x-forwarded-for'] as string ||
      req.headers['x-real-ip'] as string ||
      req.connection.remoteAddress ||
      'unknown'
    );
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  async isAllowed(req: NextApiRequest): Promise<{
    allowed: boolean;
    resetTime: number;
    remaining: number;
    limit: number;
  }> {
    const key = this.config.keyGenerator!(req);
    const now = Date.now();
    let entry = this.store.get(key);

    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + this.config.windowMs,
        blocked: false
      };
      this.store.set(key, entry);
    }

    const remaining = Math.max(0, this.config.maxRequests - entry.count);
    const allowed = entry.count < this.config.maxRequests && !entry.blocked;

    if (allowed) {
      entry.count++;
    } else {
      entry.blocked = true;
      // ブロック時間を延長（攻撃対策）
      entry.resetTime = Math.max(entry.resetTime, now + this.config.windowMs * 2);
    }

    return {
      allowed,
      resetTime: entry.resetTime,
      remaining: remaining - (allowed ? 1 : 0),
      limit: this.config.maxRequests
    };
  }
}

// レート制限ミドルウェア
export function withRateLimit(config: RateLimitConfig) {
  const limiter = new EnhancedRateLimiter(config);

  return function rateLimitMiddleware(
    handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
  ) {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      try {
        const result = await limiter.isAllowed(req);

        // レスポンスヘッダーを設定
        res.setHeader('X-RateLimit-Limit', result.limit);
        res.setHeader('X-RateLimit-Remaining', result.remaining);
        res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000));

        if (!result.allowed) {
          const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
          res.setHeader('Retry-After', retryAfter);
          
          return res.status(429).json({
            error: 'レート制限に達しました',
            message: `${retryAfter}秒後に再試行してください`,
            code: 'rate_limit_exceeded',
            retryAfter
          });
        }

        return handler(req, res);
      } catch (error) {
        console.error('Rate limiter error:', error);
        // レート制限エラーの場合でもリクエストを通す（フェイルオープン）
        return handler(req, res);
      }
    };
  };
}

// 管理者API用の厳しいレート制限
export const adminRateLimit = withRateLimit({
  maxRequests: 5,
  windowMs: 60 * 1000, // 1分
  keyGenerator: (req) => {
    const ip = req.headers['x-forwarded-for'] as string || 
               req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    return `admin:${ip}:${userAgent}`;
  }
});

// 一般API用のレート制限
export const generalRateLimit = withRateLimit({
  maxRequests: 100,
  windowMs: 15 * 60 * 1000, // 15分
});

// 認証API用のレート制限
export const authRateLimit = withRateLimit({
  maxRequests: 10,
  windowMs: 15 * 60 * 1000, // 15分
});

// 検索API用のレート制限
export const searchRateLimit = withRateLimit({
  maxRequests: 50,
  windowMs: 60 * 1000, // 1分
});