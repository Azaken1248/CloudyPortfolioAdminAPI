import { describe, it, expect } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { createApp } from '../../src/app.js';
import { CommissionTier } from '../../src/models/index.js';
import type { JwtPayload } from '../../src/types/auth.js';

const JWT_SECRET = process.env.JWT_SECRET!;
const app = createApp();

function authCookie(): string {
  const payload: JwtPayload = { discordId: '123456789', username: 'admin', avatar: null, role: 'admin' };
  return `token=${jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' })}`;
}

const validTier = {
  name: 'Bust Sketch',
  priceLabel: '$25-$40',
  detailTag: 'Sketch / Lineart',
  description: 'A clean bust-level sketch.',
};

describe('Commissions Routes', () => {
  describe('GET /api/commissions', () => {
    it('should return empty array when no tiers exist', async () => {
      const res = await request(app).get('/api/commissions');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });

    it('should return tiers sorted by sortOrder', async () => {
      await CommissionTier.create([
        { ...validTier, name: 'C', sortOrder: 2 },
        { ...validTier, name: 'A', sortOrder: 0 },
        { ...validTier, name: 'B', sortOrder: 1 },
      ]);

      const res = await request(app).get('/api/commissions');
      expect(res.body.data[0].name).toBe('A');
      expect(res.body.data[2].name).toBe('C');
    });
  });

  describe('POST /api/commissions', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app).post('/api/commissions').send(validTier);
      expect(res.status).toBe(401);
    });

    it('should create tier with auth', async () => {
      const res = await request(app)
        .post('/api/commissions')
        .set('Cookie', authCookie())
        .send(validTier);

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Bust Sketch');
    });

    it('should fail without required fields', async () => {
      const res = await request(app)
        .post('/api/commissions')
        .set('Cookie', authCookie())
        .send({ name: 'Incomplete' });

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/commissions/:id', () => {
    it('should update tier with auth', async () => {
      const tier = await CommissionTier.create(validTier);

      const res = await request(app)
        .put(`/api/commissions/${tier._id}`)
        .set('Cookie', authCookie())
        .send({ name: 'Updated Tier' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Tier');
    });

    it('should return 404 for non-existent tier', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/commissions/${fakeId}`)
        .set('Cookie', authCookie())
        .send({ name: 'Nope' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/commissions/:id', () => {
    it('should delete tier with auth', async () => {
      const tier = await CommissionTier.create(validTier);

      const res = await request(app)
        .delete(`/api/commissions/${tier._id}`)
        .set('Cookie', authCookie());

      expect(res.status).toBe(200);
      const found = await CommissionTier.findById(tier._id);
      expect(found).toBeNull();
    });
  });

  describe('PUT /api/commissions/sort', () => {
    it('should batch update sort orders', async () => {
      const [a, b] = await Promise.all([
        CommissionTier.create({ ...validTier, name: 'A', sortOrder: 0 }),
        CommissionTier.create({ ...validTier, name: 'B', sortOrder: 1 }),
      ]);

      const res = await request(app)
        .put('/api/commissions/sort')
        .set('Cookie', authCookie())
        .send({
          items: [
            { id: b._id.toString(), sortOrder: 0 },
            { id: a._id.toString(), sortOrder: 1 },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.data[0].name).toBe('B');
      expect(res.body.data[1].name).toBe('A');
    });

    it('should return 400 for missing items', async () => {
      const res = await request(app)
        .put('/api/commissions/sort')
        .set('Cookie', authCookie())
        .send({});

      expect(res.status).toBe(400);
    });
  });
});
