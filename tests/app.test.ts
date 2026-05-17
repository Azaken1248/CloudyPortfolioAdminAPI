
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('Express App', () => {

  describe('GET /api/health', () => {
    it('should return 200 with health status', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('healthy');
      expect(res.body.data.environment).toBeDefined();
      expect(res.body.data.timestamp).toBeDefined();
    });
  });
  describe('Unknown routes', () => {
    it('should return 404 for unknown GET route', async () => {
      const res = await request(app).get('/api/nonexistent');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
      expect(res.body.error.message).toContain('/api/nonexistent');
    });

    it('should return 404 for unknown POST route', async () => {
      const res = await request(app).post('/api/nonexistent');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('POST');
    });

    it('should return 404 for root path', async () => {
      const res = await request(app).get('/');

      expect(res.status).toBe(404);
    });
  });
  describe('CORS headers', () => {
    it('should include CORS headers for configured origin', async () => {
      const res = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:5173');

      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });
  });
  describe('JSON body parsing', () => {
    it('should accept JSON content type', async () => {
      const res = await request(app)
        .post('/api/nonexistent')
        .send({ test: 'data' })
        .set('Content-Type', 'application/json');

      expect(res.status).toBe(404);
    });
  });
});
