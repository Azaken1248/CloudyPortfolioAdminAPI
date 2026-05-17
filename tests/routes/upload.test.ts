import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../../src/app.js';
import type { JwtPayload } from '../../src/types/auth.js';

const JWT_SECRET = process.env.JWT_SECRET!;
const app = createApp();

function authCookie(): string {
  const p: JwtPayload = { discordId: '123456789', username: 'admin', avatar: null, role: 'admin' };
  return `token=${jwt.sign(p, JWT_SECRET, { expiresIn: '1h' })}`;
}

describe('Upload Routes', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('POST 401 without auth', async () => {
    const r = await request(app)
      .post('/api/upload')
      .attach('image', Buffer.from('fake'), 'test.png');
    expect(r.status).toBe(401);
  });

  it('POST 400 without file', async () => {
    const r = await request(app)
      .post('/api/upload')
      .set('Cookie', authCookie());
    expect(r.status).toBe(400);
  });

  it('POST 500 with invalid image data (sharp rejects)', async () => {
    const r = await request(app)
      .post('/api/upload')
      .set('Cookie', authCookie())
      .attach('image', Buffer.from('not-a-real-image'), 'broken.png');
    expect(r.status).toBe(500);
  });
});
