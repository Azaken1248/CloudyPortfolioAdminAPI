import { describe, it, expect } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { createApp } from '../../src/app.js';
import { FaqItem } from '../../src/models/index.js';
import type { JwtPayload } from '../../src/types/auth.js';

const JWT_SECRET = process.env.JWT_SECRET!;
const app = createApp();

function authCookie(): string {
  const p: JwtPayload = { discordId: '123456789', username: 'admin', avatar: null, role: 'admin' };
  return `token=${jwt.sign(p, JWT_SECRET, { expiresIn: '1h' })}`;
}

const validFaq = { question: 'How?', answer: 'Contact form.' };

describe('FAQ Routes', () => {
  it('GET returns empty array', async () => {
    const r = await request(app).get('/api/faqs');
    expect(r.status).toBe(200);
    expect(r.body.data).toHaveLength(0);
  });

  it('GET returns sorted FAQs', async () => {
    await FaqItem.create([
      { ...validFaq, question: 'C?', sortOrder: 2 },
      { ...validFaq, question: 'A?', sortOrder: 0 },
    ]);
    const r = await request(app).get('/api/faqs');
    expect(r.body.data[0].question).toBe('A?');
  });

  it('POST 401 without auth', async () => {
    expect((await request(app).post('/api/faqs').send(validFaq)).status).toBe(401);
  });

  it('POST creates FAQ', async () => {
    const r = await request(app).post('/api/faqs').set('Cookie', authCookie()).send(validFaq);
    expect(r.status).toBe(201);
    expect(r.body.data.question).toBe('How?');
  });

  it('POST 400 missing fields', async () => {
    const r = await request(app).post('/api/faqs').set('Cookie', authCookie()).send({});
    expect(r.status).toBe(400);
  });

  it('PUT updates FAQ', async () => {
    const f = await FaqItem.create(validFaq);
    const r = await request(app).put(`/api/faqs/${f._id}`).set('Cookie', authCookie()).send({ question: 'Updated?' });
    expect(r.body.data.question).toBe('Updated?');
  });

  it('PUT 404 non-existent', async () => {
    const r = await request(app).put(`/api/faqs/${new mongoose.Types.ObjectId()}`).set('Cookie', authCookie()).send({ question: 'X' });
    expect(r.status).toBe(404);
  });

  it('DELETE removes FAQ', async () => {
    const f = await FaqItem.create(validFaq);
    const r = await request(app).delete(`/api/faqs/${f._id}`).set('Cookie', authCookie());
    expect(r.status).toBe(200);
    expect(await FaqItem.findById(f._id)).toBeNull();
  });

  it('PUT /sort reorders', async () => {
    const [a, b] = await Promise.all([
      FaqItem.create({ ...validFaq, question: 'A?', sortOrder: 0 }),
      FaqItem.create({ ...validFaq, question: 'B?', sortOrder: 1 }),
    ]);
    const r = await request(app).put('/api/faqs/sort').set('Cookie', authCookie())
      .send({ items: [{ id: b._id.toString(), sortOrder: 0 }, { id: a._id.toString(), sortOrder: 1 }] });
    expect(r.body.data[0].question).toBe('B?');
  });

  it('PUT /sort 400 empty', async () => {
    const r = await request(app).put('/api/faqs/sort').set('Cookie', authCookie()).send({ items: [] });
    expect(r.status).toBe(400);
  });
});
