import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.util';
import { sendResponse } from '../utils/response.util';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';

  logger.error(`[${req.method}] ${req.originalUrl} - Error: ${message}`, {
    stack: err.stack,
  });

  sendResponse(res, statusCode, {
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { error: { stack: err.stack } }),
  });
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  logger.warn(`Route not found: [${req.method}] ${req.originalUrl}`);
  sendResponse(res, 404, {
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
  });
};
