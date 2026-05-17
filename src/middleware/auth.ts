import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UnauthorizedError } from '../utils/errors.js';
import type { JwtPayload } from '../types/auth.js';

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token: string | undefined = req.cookies?.token;

  if (!token) {
    throw new UnauthorizedError('Authentication required');
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    (req as Request & { user: JwtPayload }).user = {
      discordId: decoded.discordId,
      username: decoded.username,
      avatar: decoded.avatar,
      role: decoded.role,
    };

    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Token expired');
    }
    if (err instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Invalid token');
    }
    throw new UnauthorizedError('Authentication failed');
  }
}
