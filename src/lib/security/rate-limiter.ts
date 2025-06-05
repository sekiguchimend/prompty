import { NextApiRequest, NextApiResponse } from 'next';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...config
    };

    // Clean up expired entries every 5 minutes
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime <= now) {
        delete this.store[key];
      }
    });
  }

  private getIdentifier(req: NextApiRequest): string {
    // Try to get real IP from various headers
    const forwarded = req.headers['x-forwarded-for'];
    const realIp = req.headers['x-real-ip'];
    const cfConnectingIp = req.headers['cf-connecting-ip'];
    
    let ip = '';
    
    if (typeof forwarded === 'string') {
      ip = forwarded.split(',')[0].trim();
    } else if (typeof realIp === 'string') {
      ip = realIp;
    } else if (typeof cfConnectingIp === 'string') {
      ip = cfConnectingIp;
    } else {
      ip = req.socket.remoteAddress || 'unknown';
    }

    // For authenticated requests, also include user ID if available
    const userAgent = req.headers['user-agent'] || '';
    const authHeader = req.headers.authorization;
    
    return `${ip}:${userAgent.substring(0, 50)}${authHeader ? ':auth' : ''}`;
  }

  public async isAllowed(req: NextApiRequest): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  }> {
    const identifier = this.getIdentifier(req);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Initialize or get existing record
    if (!this.store[identifier] || this.store[identifier].resetTime <= now) {
      this.store[identifier] = {
        count: 0,
        resetTime: now + this.config.windowMs
      };
    }

    const record = this.store[identifier];

    // Check if limit exceeded
    if (record.count >= this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime,
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      };
    }

    // Increment counter
    record.count++;

    return {
      allowed: true,
      remaining: this.config.maxRequests - record.count,
      resetTime: record.resetTime
    };
  }

  public middleware() {
    return async (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
      try {
        const result = await this.isAllowed(req);

        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', this.config.maxRequests);
        res.setHeader('X-RateLimit-Remaining', result.remaining);
        res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());

        if (!result.allowed) {
          res.setHeader('Retry-After', result.retryAfter || 60);
          return res.status(429).json({
            error: 'Too many requests',
            message: 'Rate limit exceeded. Please try again later.',
            retryAfter: result.retryAfter
          });
        }

        next();
      } catch (error) {
        console.error('Rate limiter error:', error);
        // On error, allow the request to proceed
        next();
      }
    };
  }
}

// Pre-configured rate limiters for different endpoints
export const generalRateLimit = new RateLimiter({
  maxRequests: 100,
  windowMs: 15 * 60 * 1000 // 15 minutes
});

export const authRateLimit = new RateLimiter({
  maxRequests: 10,
  windowMs: 15 * 60 * 1000 // 15 minutes for auth endpoints
});

export const uploadRateLimit = new RateLimiter({
  maxRequests: 20,
  windowMs: 60 * 60 * 1000 // 1 hour for uploads
});

export const paymentRateLimit = new RateLimiter({
  maxRequests: 5,
  windowMs: 60 * 60 * 1000 // 1 hour for payments
});

export const aiRateLimit = new RateLimiter({
  maxRequests: 50,
  windowMs: 60 * 60 * 1000 // 1 hour for AI requests
});

// Helper function to apply rate limiting to API routes
export const withRateLimit = (
  rateLimiter: RateLimiter,
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const middleware = rateLimiter.middleware();
    
    return new Promise<void>((resolve, reject) => {
      middleware(req, res, async () => {
        try {
          await handler(req, res);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  };
};

export default RateLimiter;