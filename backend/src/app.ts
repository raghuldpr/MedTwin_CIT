import express, { Application } from 'express';
import cors from 'cors';
import routes from './routes';
import {
  errorHandler,
  notFoundHandler,
  securityHeaders,
  nosqlSanitizer,
  apiRateLimiter,
} from './middleware';

export const createApp = (): Application => {
  const app: Application = express();

  // Suppress express header disclosure
  app.disable('x-powered-by');

  // Security HTTP Headers
  app.use(securityHeaders);

  // Strict CORS Configuration
  app.use(
    cors({
      origin: process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
        : '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 86400,
    })
  );

  // Strict JSON & URL-Encoded body parsers with size limits
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Global NoSQL Injection & Prototype Pollution Sanitizer
  app.use(nosqlSanitizer);

  // Global API Rate Limiter
  app.use('/api', apiRateLimiter);

  // Root / Health check redirect or top-level info
  app.get('/', (req, res) => {
    res.status(200).json({
      success: true,
      name: 'MedTwin Backend API',
      version: '1.0.0',
      endpoints: {
        health: '/api/health',
      },
    });
  });

  // Mount API router
  app.use('/api', routes);

  // 404 Handler for undefined routes
  app.use(notFoundHandler);

  // Global Centralized Error Handler
  app.use(errorHandler);

  return app;
};

export const app: Application = createApp();
export default app;
