import express, { type Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { NotFoundError } from './utils/errors.js';

export function createApp(): Application {
  const app = express();

  app.use(cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  app.use(cookieParser());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      success: true,
      data: {
        status: 'healthy',
        environment: env.NODE_ENV,
        timestamp: new Date().toISOString(),
      },
    });
  });

  app.use((req, _res, next) => {
    next(new NotFoundError(`Route ${req.method} ${req.originalUrl}`));
  });

  app.use(errorHandler);

  return app;
}
