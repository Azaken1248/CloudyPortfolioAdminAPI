import { Router, type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { requireAuth } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import type { JwtPayload, DiscordTokenResponse, DiscordUser, AuthenticatedRequest } from '../types/auth.js';

const DISCORD_API_BASE = 'https://discord.com/api/v10';
const DISCORD_AUTH_URL = 'https://discord.com/api/oauth2/authorize';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const router = Router();

router.get('/discord', (_req: Request, res: Response) => {
  const params = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID,
    redirect_uri: env.DISCORD_REDIRECT_URI,
    response_type: 'code',
    scope: 'identify',
  });

  res.redirect(`${DISCORD_AUTH_URL}?${params.toString()}`);
});

router.get('/discord/callback', async (req: Request, res: Response) => {
  const { code } = req.query;

  if (!code || typeof code !== 'string') {
    res.redirect(`${env.CLIENT_URL}/login?error=missing_code`);
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
