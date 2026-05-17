import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

export async function connectDB(): Promise<typeof mongoose> {
  try {
    const connection = await mongoose.connect(env.MONGO_URI);

    logger.info(`[DB] MongoDB connected: ${connection.connection.host}`);

    mongoose.connection.on('error', (err) => {
      logger.error('[DB] MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('[DB] MongoDB disconnected. Attempting reconnect...');
    });

    return connection;
  } catch (error) {
    logger.error('[DB] Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  logger.info('[DB] MongoDB disconnected gracefully');
}
