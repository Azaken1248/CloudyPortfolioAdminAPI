import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../../src/app.js';
import type { JwtPayload } from '../../src/types/auth.js';

const JWT_SECRET = process.env.JWT_SECRET!;
const CLIENT_URL = process.env.CLIENT_URL!;

const app = createApp();

function signTestToken(payload: JwtPayload, options?: jwt.SignOptions): string {
  return jwt.sign(payload, JWT_SECRET, options);
}

const whitelistedPayload: JwtPayload = {
  discordId: '123456789',
  username: 'cloudyartist',
  avatar: 'avatar_hash_123',
  role: 'admin',
};

function mockDiscordSuccess(discordId: string, username: string, avatar: string | null) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: string | URL | globalThis.Request) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

    if (url.includes('/oauth2/token')) {
      return new Response(JSON.stringify({
        access_token: 'mock_access_token',
        token_type: 'Bearer',
        expires_in: 604800,
        refresh_token: 'mock_refresh_token',
        scope: 'identify',
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (url.includes('/users/@me')) {
      return new Response(JSON.stringify({
        id: discordId,
        username,
        avatar,
        discriminator: '0',
        global_name: username,
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response('Not Found', { status: 404 });
  });
}

describe('Auth Routes', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/auth/discord', () => {
    it('should redirect to Discord authorization URL', async () => {
      const res = await request(app).get('/api/auth/discord');

      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('discord.com/api/oauth2/authorize');
    });

    it('should include required OAuth2 parameters', async () => {
      const res = await request(app).get('/api/auth/discord');
      const location = res.headers.location as string;

      expect(location).toContain('client_id=test-client-id');
      expect(location).toContain('response_type=code');
      expect(location).toContain('scope=identify');
      expect(location).toContain('redirect_uri=');
    });
  });

  describe('GET /api/auth/discord/callback', () => {
    it('should redirect to login with error when code is missing', async () => {
      const res = await request(app).get('/api/auth/discord/callback');

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe(`${CLIENT_URL}/login?error=missing_code`);
    });

    it('should redirect to login with error when Discord token exchange fails', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response('Unauthorized', { status: 401 }),
      );

      const res = await request(app).get('/api/auth/discord/callback?code=invalid_code');

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe(`${CLIENT_URL}/login?error=discord_error`);
    });

    it('should redirect to login with error when Discord user fetch fails', async () => {
      vi.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce(
          new Response(JSON.stringify({
            access_token: 'mock_token',
            token_type: 'Bearer',
            expires_in: 604800,
            refresh_token: 'mock_refresh',
            scope: 'identify',
          }), { status: 200, headers: { 'Content-Type': 'application/json' } }),
        )
        .mockResolvedValueOnce(
          new Response('Unauthorized', { status: 401 }),
        );

      const res = await request(app).get('/api/auth/discord/callback?code=valid_code');

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe(`${CLIENT_URL}/login?error=discord_error`);
    });

    it('should redirect to login with unauthorized error for non-whitelisted user', async () => {
      mockDiscordSuccess('999999999', 'stranger', 'avatar_hash');

      const res = await request(app).get('/api/auth/discord/callback?code=valid_code');

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe(`${CLIENT_URL}/login?error=unauthorized`);
    });

    it('should set JWT cookie and redirect to admin for whitelisted user', async () => {
      mockDiscordSuccess('123456789', 'cloudyartist', 'avatar_hash_123');

      const res = await request(app).get('/api/auth/discord/callback?code=valid_code');

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe(`${CLIENT_URL}/admin`);

      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();

      const tokenCookie = Array.isArray(cookies)
        ? cookies.find((c: string) => c.startsWith('token='))
        : (cookies as string);
      expect(tokenCookie).toBeDefined();
      expect(tokenCookie).toContain('HttpOnly');
      expect(tokenCookie).toContain('Path=/');
    });

    it('should issue a valid JWT containing correct payload for whitelisted user', async () => {
      mockDiscordSuccess('123456789', 'cloudyartist', 'avatar_hash_123');

      const res = await request(app).get('/api/auth/discord/callback?code=valid_code');

      const cookies = res.headers['set-cookie'] as unknown as string[];
      const tokenCookie = Array.isArray(cookies)
        ? cookies.find((c: string) => c.startsWith('token='))!
        : (cookies as string);

      const tokenValue = tokenCookie.split('=')[1].split(';')[0];
      const decoded = jwt.verify(tokenValue, JWT_SECRET) as JwtPayload;

      expect(decoded.discordId).toBe('123456789');
      expect(decoded.username).toBe('cloudyartist');
      expect(decoded.avatar).toBe('avatar_hash_123');
      expect(decoded.role).toBe('admin');
    });

    it('should handle fetch throwing a network error gracefully', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'));

      const res = await request(app).get('/api/auth/discord/callback?code=valid_code');

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe(`${CLIENT_URL}/login?error=discord_error`);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return user data with valid JWT cookie', async () => {
      const token = signTestToken(whitelistedPayload, { expiresIn: '7d' });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', `token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.discordId).toBe('123456789');
      expect(res.body.data.username).toBe('cloudyartist');
      expect(res.body.data.avatar).toBe('avatar_hash_123');
      expect(res.body.data.role).toBe('admin');
    });

    it('should return 401 with expired JWT cookie', async () => {
      const token = signTestToken(whitelistedPayload, { expiresIn: '0s' });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', `token=${token}`);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 with tampered JWT cookie', async () => {
      const token = signTestToken(whitelistedPayload, { expiresIn: '7d' });
      const tampered = token.slice(0, -5) + 'XXXXX';

      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', `token=${tampered}`);

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should clear the token cookie and return success', async () => {
      const token = signTestToken(whitelistedPayload, { expiresIn: '7d' });

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', `token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBe('Logged out successfully');

      const cookies = res.headers['set-cookie'] as unknown as string[];
      const tokenCookie = Array.isArray(cookies)
        ? cookies.find((c: string) => c.startsWith('token='))
        : (cookies as string);
      expect(tokenCookie).toBeDefined();
      expect(tokenCookie).toContain('token=;');
    });

    it('should return success even without an active session', async () => {
      const res = await request(app).post('/api/auth/logout');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
