import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { requireAuth } from '../../src/middleware/auth.js';
import type { JwtPayload } from '../../src/types/auth.js';

const JWT_SECRET = process.env.JWT_SECRET!;

function createMockReq(cookies: Record<string, string> = {}): Request {
  return { cookies } as unknown as Request;
}

function createMockRes(): Response {
  return {} as unknown as Response;
}

function createMockNext(): NextFunction & { mock: { calls: unknown[][] } } {
  return vi.fn() as unknown as NextFunction & { mock: { calls: unknown[][] } };
}

function signTestToken(payload: JwtPayload, options?: jwt.SignOptions): string {
  return jwt.sign(payload, JWT_SECRET, options);
}

const validPayload: JwtPayload = {
  discordId: '123456789',
  username: 'testuser',
  avatar: 'abc123',
  role: 'admin',
};

describe('requireAuth Middleware', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should throw UnauthorizedError when no cookie is present', () => {
    const req = createMockReq();
    const res = createMockRes();
    const next = createMockNext();

    expect(() => requireAuth(req, res, next)).toThrow('Authentication required');
    expect(next.mock.calls).toHaveLength(0);
  });

  it('should throw UnauthorizedError when cookie is empty string', () => {
    const req = createMockReq({ token: '' });
    const res = createMockRes();
    const next = createMockNext();

    expect(() => requireAuth(req, res, next)).toThrow('Authentication required');
  });

  it('should throw UnauthorizedError when token is malformed', () => {
    const req = createMockReq({ token: 'not.a.valid.jwt' });
    const res = createMockRes();
    const next = createMockNext();

    expect(() => requireAuth(req, res, next)).toThrow('Invalid token');
  });

  it('should throw UnauthorizedError when token is signed with wrong secret', () => {
    const token = jwt.sign(validPayload, 'wrong-secret');
    const req = createMockReq({ token });
    const res = createMockRes();
    const next = createMockNext();

    expect(() => requireAuth(req, res, next)).toThrow('Invalid token');
  });

  it('should throw UnauthorizedError when token is expired', () => {
    const token = signTestToken(validPayload, { expiresIn: '0s' });
    const req = createMockReq({ token });
    const res = createMockRes();
    const next = createMockNext();

    expect(() => requireAuth(req, res, next)).toThrow('Token expired');
  });

  it('should attach user to request and call next() on valid token', () => {
    const token = signTestToken(validPayload, { expiresIn: '7d' });
    const req = createMockReq({ token });
    const res = createMockRes();
    const next = createMockNext();

    requireAuth(req, res, next);

    const authedReq = req as Request & { user: JwtPayload };
    expect(authedReq.user).toBeDefined();
    expect(authedReq.user.discordId).toBe('123456789');
    expect(authedReq.user.username).toBe('testuser');
    expect(authedReq.user.avatar).toBe('abc123');
    expect(authedReq.user.role).toBe('admin');
    expect(next.mock.calls).toHaveLength(1);
  });

  it('should handle null avatar in token payload', () => {
    const payload: JwtPayload = { ...validPayload, avatar: null };
    const token = signTestToken(payload, { expiresIn: '7d' });
    const req = createMockReq({ token });
    const res = createMockRes();
    const next = createMockNext();

    requireAuth(req, res, next);

    const authedReq = req as Request & { user: JwtPayload };
    expect(authedReq.user.avatar).toBeNull();
    expect(next.mock.calls).toHaveLength(1);
  });

  it('should throw UnauthorizedError when cookies object is undefined', () => {
    const req = { cookies: undefined } as unknown as Request;
    const res = createMockRes();
    const next = createMockNext();

    expect(() => requireAuth(req, res, next)).toThrow('Authentication required');
  });
});
