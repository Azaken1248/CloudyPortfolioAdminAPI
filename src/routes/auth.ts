import { Router, type Request, type Response } from 'express';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { requireAuth } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import type { JwtPayload, DiscordTokenResponse, DiscordUser, AuthenticatedRequest } from '../types/auth.js';

const DISCORD_API_BASE = 'https://discord.com/api/v10';
const DISCORD_AUTH_URL = 'https://discord.com/api/oauth2/authorize';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const STATE_COOKIE = 'oauth_state';
const STATE_MAX_AGE = 10 * 60 * 1000;

/**
 * OAuth2 `state`, per RFC 6749 §10.12.
 *
 * A random value is written to a short-lived httpOnly cookie and echoed through
 * Discord, then compared on return. Without it the callback accepts any
 * authorization code presented to it, so an attacker can complete a login the
 * victim never started (login CSRF) — the whitelist limits who ends up
 * authenticated, but not whose session is established.
 */
function issueState(res: Response): string {
  const state = crypto.randomBytes(32).toString('base64url');

  res.cookie(STATE_COOKIE, state, {
    httpOnly: true,
    secure: env.IS_PRODUCTION,
    sameSite: 'lax',
    maxAge: STATE_MAX_AGE,
    path: '/api/auth',
  });

  return state;
}

function clearState(res: Response): void {
  res.clearCookie(STATE_COOKIE, {
    httpOnly: true,
    secure: env.IS_PRODUCTION,
    sameSite: 'lax',
    path: '/api/auth',
  });
}

/** Constant-time comparison so the check cannot be probed by timing. */
function stateMatches(received: unknown, expected: unknown): boolean {
  if (typeof received !== 'string' || typeof expected !== 'string') return false;
  if (received.length !== expected.length || received.length === 0) return false;

  return crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
}

const router = Router();

router.get('/discord', (_req: Request, res: Response) => {
  const params = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID,
    redirect_uri: env.DISCORD_REDIRECT_URI,
    response_type: 'code',
    scope: 'identify',
    state: issueState(res),
  });

  res.redirect(`${DISCORD_AUTH_URL}?${params.toString()}`);
});

router.get('/discord/callback', async (req: Request, res: Response) => {
  const { code, state } = req.query;
  const expectedState = (req.cookies as Record<string, string> | undefined)?.[STATE_COOKIE];

  // Consume the state cookie on every outcome so it cannot be replayed.
  clearState(res);

  if (!code || typeof code !== 'string') {
    res.redirect(`${env.CLIENT_URL}/login?error=missing_code`);
    return;
  }

  if (!stateMatches(state, expectedState)) {
    logger.warn('[AUTH] OAuth callback rejected: state mismatch or missing');
    res.redirect(`${env.CLIENT_URL}/login?error=invalid_state`);
    return;
  }

  try {
    const tokenResponse = await fetch(`${DISCORD_API_BASE}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.DISCORD_CLIENT_ID,
        client_secret: env.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: env.DISCORD_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      logger.error('[AUTH] Discord token exchange failed:', tokenResponse.status);
      res.redirect(`${env.CLIENT_URL}/login?error=discord_error`);
      return;
    }

    const tokenData = (await tokenResponse.json()) as DiscordTokenResponse;

    const userResponse = await fetch(`${DISCORD_API_BASE}/users/@me`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userResponse.ok) {
      logger.error('[AUTH] Discord user fetch failed:', userResponse.status);
      res.redirect(`${env.CLIENT_URL}/login?error=discord_error`);
      return;
    }

    const discordUser = (await userResponse.json()) as DiscordUser;

    if (!env.ALLOWED_DISCORD_IDS.includes(discordUser.id)) {
      logger.warn('[AUTH] Unauthorized Discord user attempted login:', discordUser.id);
      res.redirect(`${env.CLIENT_URL}/login?error=unauthorized`);
      return;
    }

    const payload: JwtPayload = {
      discordId: discordUser.id,
      username: discordUser.username,
      avatar: discordUser.avatar,
      role: 'admin',
    };

    const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: env.IS_PRODUCTION,
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });

    res.redirect(`${env.CLIENT_URL}/admin`);
  } catch (err) {
    logger.error('[AUTH] OAuth callback error:', err);
    res.redirect(`${env.CLIENT_URL}/login?error=discord_error`);
  }
});

router.get('/me', requireAuth, (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;

  res.json({
    success: true,
    data: user,
  });
});

router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: env.IS_PRODUCTION,
    sameSite: 'lax',
    path: '/',
  });

  res.json({
    success: true,
    data: { message: 'Logged out successfully' },
  });
});

export { router as authRouter };
