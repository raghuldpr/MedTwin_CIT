import { Request, Response, NextFunction } from 'express';
import { sendResponse } from '../utils/response.util';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const store: Map<string, RateLimitRecord> = new Map();

// Periodic cleanup every 5 minutes to prevent memory leak in store
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of store.entries()) {
    if (now > record.resetTime) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export const createRateLimiter = (options: {
  windowMs: number;
  max: number;
  message: string;
  prefix?: string;
}) => {
  const prefix = options.prefix || 'rl';
  const { windowMs, max, message } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1';
    const key = `${prefix}:${ip}:${req.path}`;
    const now = Date.now();

    let record = store.get(key);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      store.set(key, record);
    } else {
      record.count += 1;
    }

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader(
      'X-RateLimit-Remaining',
      Math.max(0, max - record.count)
    );
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > max) {
      res.setHeader('Retry-After', Math.ceil((record.resetTime - now) / 1000));
      sendResponse(res, 429, {
        success: false,
        message,
      });
      return;
    }

    next();
  };
};

// 1. Auth Rate Limiter (login & register): max 10 requests / 15 minutes
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts. Please try again after 15 minutes.',
  prefix: 'auth',
});

// 2. Doctor PIN Verification Rate Limiter: max 200 requests in dev / 5 in prod
export const pinRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 5 : 200,
  message: 'Too many failed PIN verification attempts. Please try again after 15 minutes.',
  prefix: 'pin',
});

// 3. AI / OCR Rate Limiter: max 20 requests / 15 minutes
export const aiOcrRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'AI processing rate limit exceeded. Please try again later.',
  prefix: 'ai',
});

// 4. Voice Command Rate Limiter: max 30 requests / 15 minutes
export const voiceRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Voice command rate limit exceeded. Please try again later.',
  prefix: 'voice',
});

// 5. Document Upload Rate Limiter: max 15 requests / 15 minutes
export const uploadRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: 'Document upload rate limit exceeded. Please try again later.',
  prefix: 'upload',
});

// 6. Global API Rate Limiter: max 100 requests / 1 minute
export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 100,
  message: 'Too many requests to MedTwin API. Rate limit exceeded.',
  prefix: 'api',
});
