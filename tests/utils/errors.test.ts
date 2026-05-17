
import { describe, it, expect } from 'vitest';
import {
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
} from '../../src/utils/errors.js';

describe('Error Utilities', () => {
  describe('AppError', () => {
    it('should create with default values', () => {
      const err = new AppError('Something went wrong');

      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(AppError);
      expect(err.message).toBe('Something went wrong');
      expect(err.statusCode).toBe(500);
      expect(err.code).toBe('INTERNAL_ERROR');
      expect(err.isOperational).toBe(true);
      expect(err.stack).toBeDefined();
    });

    it('should create with custom values', () => {
      const err = new AppError('Custom', 422, 'CUSTOM_CODE', false);

      expect(err.statusCode).toBe(422);
      expect(err.code).toBe('CUSTOM_CODE');
      expect(err.isOperational).toBe(false);
    });
  });

  describe('NotFoundError', () => {
    it('should have 404 status', () => {
      const err = new NotFoundError('Artwork');

      expect(err.statusCode).toBe(404);
      expect(err.code).toBe('NOT_FOUND');
      expect(err.message).toBe('Artwork not found');
    });

    it('should use default resource name', () => {
      const err = new NotFoundError();
      expect(err.message).toBe('Resource not found');
    });
  });

  describe('ValidationError', () => {
    it('should have 400 status', () => {
      const err = new ValidationError('Invalid email');

      expect(err.statusCode).toBe(400);
      expect(err.code).toBe('VALIDATION_ERROR');
      expect(err.message).toBe('Invalid email');
    });
  });

  describe('UnauthorizedError', () => {
    it('should have 401 status', () => {
      const err = new UnauthorizedError();

      expect(err.statusCode).toBe(401);
      expect(err.code).toBe('UNAUTHORIZED');
    });
  });

  describe('ForbiddenError', () => {
    it('should have 403 status', () => {
      const err = new ForbiddenError();

      expect(err.statusCode).toBe(403);
      expect(err.code).toBe('FORBIDDEN');
    });
  });

  describe('ConflictError', () => {
    it('should have 409 status', () => {
      const err = new ConflictError();

      expect(err.statusCode).toBe(409);
      expect(err.code).toBe('CONFLICT');
    });
  });

  describe('instanceof checks', () => {
    it('all custom errors should be instanceof AppError', () => {
      expect(new NotFoundError()).toBeInstanceOf(AppError);
      expect(new ValidationError()).toBeInstanceOf(AppError);
      expect(new UnauthorizedError()).toBeInstanceOf(AppError);
      expect(new ForbiddenError()).toBeInstanceOf(AppError);
      expect(new ConflictError()).toBeInstanceOf(AppError);
    });

    it('all custom errors should be instanceof Error', () => {
      expect(new NotFoundError()).toBeInstanceOf(Error);
      expect(new ValidationError()).toBeInstanceOf(Error);
      expect(new UnauthorizedError()).toBeInstanceOf(Error);
      expect(new ForbiddenError()).toBeInstanceOf(Error);
      expect(new ConflictError()).toBeInstanceOf(Error);
    });
  });
});
