import express, { type Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authRouter } from './routes/auth.js';
import { configRouter } from './routes/config.js';
import { artworksRouter } from './routes/artworks.js';
import { commissionsRouter } from './routes/commissions.js';
import { faqsRouter } from './routes/faqs.js';
import { tosRouter } from './routes/tos.js';
import { portfolioRouter } from './routes/portfolio.js';
import { uploadRouter } from './routes/upload.js';
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

  app.use('/api/auth', authRouter);
  app.use('/api/config', configRouter);
  app.use('/api/artworks', artworksRouter);
  app.use('/api/commissions', commissionsRouter);
  app.use('/api/faqs', faqsRouter);
  app.use('/api/tos', tosRouter);
  app.use('/api/portfolio', portfolioRouter);
  app.use('/api/upload', uploadRouter);

  app.use((req, _res, next) => {
    next(new NotFoundError(`Route ${req.method} ${req.originalUrl}`));
  });

  app.use(errorHandler);

  return app;
}

