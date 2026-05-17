import { describe, it, expect } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { createApp } from '../../src/app.js';
import { Artwork } from '../../src/models/index.js';
import type { JwtPayload } from '../../src/types/auth.js';

const JWT_SECRET = process.env.JWT_SECRET!;
const app = createApp();

function authCookie(): string {
  const payload: JwtPayload = { discordId: '123456789', username: 'admin', avatar: null, role: 'admin' };
  return `token=${jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' })}`;
}

const validArtwork = {
  title: 'Test Artwork',
  category: 'Original',
  description: 'A test artwork.',
  imageUrl: 'https://example.com/art.webp',
  altText: 'Test art',
};

describe('Artworks Routes', () => {
  describe('GET /api/artworks', () => {
    it('should return empty array when no artworks exist', async () => {
      const res = await request(app).get('/api/artworks');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });

    it('should return artworks sorted by sortOrder', async () => {
      await Artwork.create([
        { ...validArtwork, title: 'C', sortOrder: 2 },
        { ...validArtwork, title: 'A', sortOrder: 0 },
        { ...validArtwork, title: 'B', sortOrder: 1 },
      ]);

      const res = await request(app).get('/api/artworks');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(3);
      expect(res.body.data[0].title).toBe('A');
      expect(res.body.data[1].title).toBe('B');
      expect(res.body.data[2].title).toBe('C');
    });
  });

  describe('GET /api/artworks/:id', () => {
    it('should return a single artwork', async () => {
      const artwork = await Artwork.create(validArtwork);

      const res = await request(app).get(`/api/artworks/${artwork._id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Test Artwork');
    });

    it('should return 404 for non-existent id', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/artworks/${fakeId}`);
      expect(res.status).toBe(404);
    });

    it('should return 400 for invalid id format', async () => {
      const res = await request(app).get('/api/artworks/not-an-id');
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/artworks', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app).post('/api/artworks').send(validArtwork);
      expect(res.status).toBe(401);
    });

    it('should create artwork with auth', async () => {
      const res = await request(app)
        .post('/api/artworks')
        .set('Cookie', authCookie())
        .send(validArtwork);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Test Artwork');
      expect(res.body.data._id).toBeDefined();
    });

    it('should fail without required fields', async () => {
      const res = await request(app)
        .post('/api/artworks')
        .set('Cookie', authCookie())
        .send({ title: 'Missing fields' });

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/artworks/:id', () => {
    it('should update artwork with auth', async () => {
      const artwork = await Artwork.create(validArtwork);

      const res = await request(app)
        .put(`/api/artworks/${artwork._id}`)
        .set('Cookie', authCookie())
        .send({ title: 'Updated Title' });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Updated Title');
    });

    it('should return 404 for non-existent artwork', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/artworks/${fakeId}`)
        .set('Cookie', authCookie())
        .send({ title: 'Nope' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/artworks/:id', () => {
    it('should delete artwork with auth', async () => {
      const artwork = await Artwork.create(validArtwork);

      const res = await request(app)
        .delete(`/api/artworks/${artwork._id}`)
        .set('Cookie', authCookie());

      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe('Artwork deleted');

      const found = await Artwork.findById(artwork._id);
      expect(found).toBeNull();
    });

    it('should return 401 without auth', async () => {
      const artwork = await Artwork.create(validArtwork);
      const res = await request(app).delete(`/api/artworks/${artwork._id}`);
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/artworks/sort', () => {
    it('should batch update sort orders', async () => {
      const [a, b, c] = await Promise.all([
        Artwork.create({ ...validArtwork, title: 'A', sortOrder: 0 }),
        Artwork.create({ ...validArtwork, title: 'B', sortOrder: 1 }),
        Artwork.create({ ...validArtwork, title: 'C', sortOrder: 2 }),
      ]);

      const res = await request(app)
        .put('/api/artworks/sort')
        .set('Cookie', authCookie())
        .send({
          items: [
            { id: c._id.toString(), sortOrder: 0 },
            { id: a._id.toString(), sortOrder: 1 },
            { id: b._id.toString(), sortOrder: 2 },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.data[0].title).toBe('C');
      expect(res.body.data[1].title).toBe('A');
      expect(res.body.data[2].title).toBe('B');
    });

    it('should return 400 for empty items', async () => {
      const res = await request(app)
        .put('/api/artworks/sort')
        .set('Cookie', authCookie())
        .send({ items: [] });

      expect(res.status).toBe(400);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app)
        .put('/api/artworks/sort')
        .send({ items: [] });

      expect(res.status).toBe(401);
    });
  });
});
