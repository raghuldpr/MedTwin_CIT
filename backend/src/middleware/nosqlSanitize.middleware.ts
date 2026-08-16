import { Request, Response, NextFunction } from 'express';

const FORBIDDEN_PROPERTIES = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Clean an object or array recursively by stripping keys starting with '$'
 * or containing '.', as well as prototype pollution properties.
 */
const sanitize = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitize(item));
  }

  if (typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      if (FORBIDDEN_PROPERTIES.has(key)) {
        continue;
      }
      if (key.startsWith('$') || key.includes('.')) {
        continue;
      }
      cleaned[key] = sanitize(obj[key]);
    }
    return cleaned;
  }

  return obj;
};

/**
 * Express middleware to sanitize req.body, req.query, and req.params against
 * MongoDB operator injection ($ne, $gt, $gte, $lt, $regex, $where) and prototype pollution.
 */
export const nosqlSanitizer = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitize(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitize(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitize(req.params);
  }
  next();
};

export default nosqlSanitizer;
