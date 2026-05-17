import { describe, it, expect } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { createApp } from '../../src/app.js';
import { TosSection } from '../../src/models/index.js';
import type { JwtPayload } from '../../src/types/auth.js';

const JWT_SECRET = process.env.JWT_SECRET!;
const app = createApp();

function authCookie(): string {
  const p: JwtPayload = { discordId: '123456789', username: 'admin', avatar: null, role: 'admin' };
  return `token=${jwt.sign(p, JWT_SECRET, { expiresIn: '1h' })}`;
}

const validTos = { heading: 'General Terms', variant: 'default' as const, points: ['Point 1'] };

describe('TOS Routes', () => {
  it('GET returns empty array', async () => {
    const r = await request(app).get('/api/tos');
    expect(r.status).toBe(200);
    expect(r.body.data).toHaveLength(0);
  });

  it('GET returns sorted sections', async () => {
    await TosSection.create([
      { ...validTos, heading: 'B', sortOrder: 1 },
      { ...validTos, heading: 'A', sortOrder: 0 },
    ]);
    const r = await request(app).get('/api/tos');
    expect(r.body.data[0].heading).toBe('A');
  });

  it('POST 401 without auth', async () => {
    expect((await request(app).post('/api/tos').send(validTos)).status).toBe(401);
  });

  it('POST creates section', async () => {
    const r = await request(app).post('/api/tos').set('Cookie', authCookie()).send(validTos);
    expect(r.status).toBe(201);
    expect(r.body.data.heading).toBe('General Terms');
  });

  it('POST 400 missing fields', async () => {
    const r = await request(app).post('/api/tos').set('Cookie', authCookie()).send({});
    expect(r.status).toBe(400);
  });

  it('PUT updates section', async () => {
    const s = await TosSection.create(validTos);
    const r = await request(app).put(`/api/tos/${s._id}`).set('Cookie', authCookie()).send({ heading: 'Updated' });
    expect(r.body.data.heading).toBe('Updated');
  });

  it('PUT 404 non-existent', async () => {
    const r = await request(app).put(`/api/tos/${new mongoose.Types.ObjectId()}`).set('Cookie', authCookie()).send({ heading: 'X' });
    expect(r.status).toBe(404);
  });

  it('DELETE removes section', async () => {
    const s = await TosSection.create(validTos);
    const r = await request(app).delete(`/api/tos/${s._id}`).set('Cookie', authCookie());
    expect(r.status).toBe(200);
    expect(await TosSection.findById(s._id)).toBeNull();
  });

  it('PUT /sort reorders', async () => {
    const [a, b] = await Promise.all([
      TosSection.create({ ...validTos, heading: 'A', sortOrder: 0 }),
      TosSection.create({ ...validTos, heading: 'B', sortOrder: 1 }),
    ]);
    const r = await request(app).put('/api/tos/sort').set('Cookie', authCookie())
      .send({ items: [{ id: b._id.toString(), sortOrder: 0 }, { id: a._id.toString(), sortOrder: 1 }] });
    expect(r.body.data[0].heading).toBe('B');
  });

  it('PUT /sort 400 empty', async () => {
    const r = await request(app).put('/api/tos/sort').set('Cookie', authCookie()).send({ items: [] });
    expect(r.status).toBe(400);
  });
});
