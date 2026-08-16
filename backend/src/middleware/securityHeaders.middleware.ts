import { Request, Response, NextFunction } from 'express';

/**
 * Security Headers and Request Timeout Protection Middleware
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking / frame embedding
  res.setHeader('X-Frame-Options', 'DENY');

  // XSS protection legacy filter flag
  res.setHeader('X-XSS-Protection', '0');

  // Enforce HTTPS HSTS
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  );

  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; frame-ancestors 'none';"
  );

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'no-referrer');

  // Suppress server technology disclosure header
  res.removeHeader('X-Powered-By');

  // Request timeout protection (30s)
  req.setTimeout(30000, () => {
    if (!res.headersSent) {
      res.status(504).json({
        success: false,
        message: 'Request timeout. Server took too long to respond.',
      });
    }
  });

  next();
};

export default securityHeaders;
