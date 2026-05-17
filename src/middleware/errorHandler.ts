import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    stack?: string;
  };
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err.name === 'ValidationError') {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: err.message,
      },
    };
    res.status(400).json(response);
    return;
  }

  if (err.name === 'CastError') {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: 'INVALID_ID',
        message: 'Invalid resource ID format',
      },
    };
    res.status(400).json(response);
    return;
  }

  if ('code' in err && (err as Record<string, unknown>).code === 11000) {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: 'DUPLICATE_KEY',
        message: 'Resource already exists',
      },
    };
    res.status(409).json(response);
    return;
  }

  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error('[FATAL] Non-operational error:', err.message, err.stack);
    }

    const response: ErrorResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
      },
    };
    res.status(err.statusCode).json(response);
    return;
  }

  logger.error('[UNHANDLED]', err.message, err.stack);

  const response: ErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    },
  };
  res.status(500).json(response);
}
