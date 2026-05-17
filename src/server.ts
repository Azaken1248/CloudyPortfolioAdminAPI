import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { createApp } from './app.js';
import { logger } from './utils/logger.js';

async function bootstrap(): Promise<void> {
  await connectDB();

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(`[SERVER] Running on http://localhost:${env.PORT}`);
    logger.info(`[SERVER] Environment: ${env.NODE_ENV}`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`[SERVER] ${signal} received. Shutting down gracefully...`);

    server.close(async () => {
      await disconnectDB();
      logger.info('[SERVER] Process terminated');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('[SERVER] Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason: unknown) => {
    logger.error('[PROCESS] Unhandled Rejection:', reason);
  });

  process.on('uncaughtException', (error: Error) => {
    logger.error('[PROCESS] Uncaught Exception:', error.message);
    process.exit(1);
  });
}

bootstrap().catch((error) => {
  logger.error('[BOOTSTRAP] Fatal error during startup:', error);
  process.exit(1);
});
