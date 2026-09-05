import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../../src/app.js';
import { GlobalConfig } from '../../src/models/index.js';
import type { JwtPayload } from '../../src/types/auth.js';

const JWT_SECRET = process.env.JWT_SECRET!;
const app = createApp();

function authCookie(): string {
  const payload: JwtPayload = { discordId: '123456789', username: 'admin', avatar: null, role: 'admin' };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
  return `token=${token}`;
}

const validConfig = {
  siteConfig: {
    siteName: 'Cluwudy',
    siteSubtitle: 'portfolio',
    pageTitle: 'Cluwudy — Portfolio',
    metaDescription: 'Art portfolio.',
    logoIcon: 'Cloud',
  },
  heroContent: {
    pillIcon: 'Palette',
    pillLabel: 'OC spotlight',
    eyebrow: 'Cluwudy',
    headline: 'Welcome.',
    body: 'I create art.',
    accent: 'Characters to life.',
    image: 'https://example.com/hero.webp',
    imageAlt: 'Hero image',
    statusPillLabel: 'Spotlight',
    ctaButtons: [
      { label: 'Gallery', href: '#gallery', variant: 'primary' as const },
    ],
  },
  gallerySection: { eyebrow: 'Gallery', title: 'Work.', description: 'Recent art.' },
  commissions: {
    section: { eyebrow: 'Commissions', title: 'Pricing.', description: 'Pick a tier.' },
  },
  faqPage: {
    section: { eyebrow: 'FAQ', title: 'Questions.', description: 'Info.' },
    faqHeading: 'FAQ',
    tosHeading: 'TOS',
    tosAcceptanceText: 'Accept TOS.',
  },
  contactContent: {
    section: { eyebrow: 'Contact', title: 'Reach out.', description: 'Message me.' },
    infoCard: { tag: 'Info', title: 'Inquiries', description: 'Respond in 2 days.', notes: [] },
    form: {
      fields: [{ name: 'name', label: 'Name', type: 'text' as const, placeholder: 'Name' }],
      submitLabel: 'Send',
      disclaimer: 'Privacy.',
    },
  },
  footerContent: { copyright: '© 2026', tagline: 'Coffee.' },
  nav: [{ id: 'home', label: 'Home', icon: 'House' }],
  socials: [],
};

describe('Config Routes', () => {
  describe('GET /api/config', () => {
    it('should return 404 when no config exists', async () => {
      const res = await request(app).get('/api/config');
      expect(res.status).toBe(404);
    });

    it('should return config when it exists', async () => {
      await GlobalConfig.create(validConfig);

      const res = await request(app).get('/api/config');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.siteConfig.siteName).toBe('Cluwudy');
    });
  });

  describe('PUT /api/config', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app).put('/api/config').send(validConfig);
      expect(res.status).toBe(401);
    });

    it('should create config via upsert when none exists', async () => {
      const res = await request(app)
        .put('/api/config')
        .set('Cookie', authCookie())
        .send(validConfig);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.siteConfig.siteName).toBe('Cluwudy');
    });

    it('should update existing config', async () => {
      await GlobalConfig.create(validConfig);

      const res = await request(app)
        .put('/api/config')
        .set('Cookie', authCookie())
        .send({ 'siteConfig.siteName': 'UpdatedName' });

      expect(res.status).toBe(200);
      expect(res.body.data.siteConfig.siteName).toBe('UpdatedName');
    });

    it('should maintain singleton pattern on multiple upserts', async () => {
      await request(app).put('/api/config').set('Cookie', authCookie()).send(validConfig);
      await request(app).put('/api/config').set('Cookie', authCookie()).send(validConfig);

      const count = await GlobalConfig.countDocuments();
      expect(count).toBe(1);
    });
  });

  describe('partial patches update fields rather than replacing subdocuments', () => {
    beforeEach(async () => {
      await GlobalConfig.create(validConfig);
    });

    it('applies a depth-2 patch without dropping its siblings', async () => {
      const before = await request(app).get('/api/config');
      const form = before.body.data.contactContent.form;
      expect(form.fields.length).toBeGreaterThan(0);

      const res = await request(app)
        .put('/api/config')
        .set('Cookie', authCookie())
        .send({ contactContent: { form: { submitLabel: 'CHANGED' } } });

      expect(res.status).toBe(200);

      const after = await request(app).get('/api/config');
      const patched = after.body.data.contactContent.form;
      expect(patched.submitLabel).toBe('CHANGED');
      // Flattening only one level replaced `form` whole, which lost these and
      // failed validation because `disclaimer` is required.
      expect(patched.fields.length).toBe(form.fields.length);
      expect(patched.disclaimer).toBe(form.disclaimer);
    });

    it('leaves a branch untouched when given an empty object', async () => {
      const before = await request(app).get('/api/config');

      const res = await request(app)
        .put('/api/config')
        .set('Cookie', authCookie())
        .send({ siteConfig: {} });

      expect(res.status).toBe(200);

      const after = await request(app).get('/api/config');
      expect(after.body.data.siteConfig).toEqual(before.body.data.siteConfig);
    });

    it('replaces an array whole rather than merging it', async () => {
      const res = await request(app)
        .put('/api/config')
        .set('Cookie', authCookie())
        .send({ nav: [{ id: 'home', label: 'Only', icon: 'House' }] });

      expect(res.status).toBe(200);

      const after = await request(app).get('/api/config');
      expect(after.body.data.nav).toHaveLength(1);
      expect(after.body.data.nav[0].label).toBe('Only');
    });
  });
});
