
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../../src/middleware/errorHandler.js';
import { NotFoundError, ValidationError, AppError } from '../../src/utils/errors.js';

function mockRes() {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) { this.statusCode = code; return this },
    json(payload: unknown) { this.body = payload; return this },
  };
  return res as unknown as Response & {
    statusCode: number;
    body: { success: boolean; error: { code: string; message: string; stack?: string } };
  };
}

const req = {} as Request;
const next = (() => {}) as NextFunction;

describe('errorHandler', () => {
  beforeEach(() => { vi.restoreAllMocks() });

  it('maps a Mongoose CastError to 400 INVALID_ID', () => {
    const res = mockRes();
    const err = Object.assign(new Error('bad id'), { name: 'CastError' });
    errorHandler(err, req, res, next);
    expect(res.statusCode).toBe(400);
    expect(res.body.error.code).toBe('INVALID_ID');
  });

  it('maps a duplicate key error to 409', () => {
    const res = mockRes();
    errorHandler(Object.assign(new Error('dup'), { code: 11000 }), req, res, next);
    expect(res.statusCode).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE_KEY');
  });

  it('uses the status and code carried by an AppError', () => {
    const res = mockRes();
    errorHandler(new NotFoundError('Artwork'), req, res, next);
    expect(res.statusCode).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.message).toContain('Artwork');
  });

  it('returns 400 for a ValidationError', () => {
    const res = mockRes();
    errorHandler(new ValidationError('Title is required'), req, res, next);
    expect(res.statusCode).toBe(400);
    expect(res.body.error.message).toBe('Title is required');
  });

  it('falls back to 500 for an unrecognised error', () => {
    const res = mockRes();
    errorHandler(new Error('kaboom'), req, res, next);
    expect(res.statusCode).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_ERROR');
  });

  it('hides internal messages and stacks in production', () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const res = mockRes();
      errorHandler(new Error('secret internal detail'), req, res, next);
      expect(res.body.error.message).not.toContain('secret internal detail');
      expect(res.body.error.stack).toBeUndefined();
    } finally {
      process.env.NODE_ENV = prev;
    }
  });

  it('marks a non-operational AppError as fatal in the log', () => {
    const res = mockRes();
    errorHandler(new AppError('boom', 500, 'INTERNAL_ERROR', false), req, res, next);
    expect(res.statusCode).toBe(500);
  });

  it('maps an oversized body to 413 rather than a generic 500', () => {
    const res = mockRes();
    errorHandler(Object.assign(new Error('request entity too large'), { type: 'entity.too.large' }), req, res, next);
    expect(res.statusCode).toBe(413);
    expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('maps malformed JSON to 400', () => {
    const res = mockRes();
    errorHandler(Object.assign(new SyntaxError('Unexpected token'), { type: 'entity.parse.failed' }), req, res, next);
    expect(res.statusCode).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });
});
