import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { GlobalConfig, Artwork, CommissionTier, FaqItem, TosSection } from '../../src/models/index.js';

const app = createApp();

const minConfig = {
  siteConfig: { siteName: 'Test', siteSubtitle: 's', pageTitle: 't', metaDescription: 'm', logoIcon: 'Cloud' },
  heroContent: { pillIcon: 'P', pillLabel: 'l', eyebrow: 'e', headline: 'h', body: 'b', accent: 'a', image: 'https://x.com/i.webp', imageAlt: 'alt', statusPillLabel: 's', ctaButtons: [] },
  gallerySection: { eyebrow: 'e', title: 't', description: 'd' },
  commissions: { section: { eyebrow: 'e', title: 't', description: 'd' } },
  faqPage: { section: { eyebrow: 'e', title: 't', description: 'd' }, faqHeading: 'f', tosHeading: 't', tosAcceptanceText: 'a' },
  contactContent: { section: { eyebrow: 'e', title: 't', description: 'd' }, infoCard: { tag: 't', title: 't', description: 'd', notes: [] }, form: { fields: [], submitLabel: 's', disclaimer: 'd' } },
  footerContent: { copyright: 'c', tagline: 't' },
  nav: [], socials: [],
};

describe('Portfolio Routes', () => {
  it('GET 404 when no config', async () => {
    const r = await request(app).get('/api/portfolio');
    expect(r.status).toBe(404);
  });

  it('GET returns aggregated portfolio data', async () => {
    await GlobalConfig.create(minConfig);
    await Artwork.create({ title: 'Art', category: 'OC', description: 'd', imageUrl: 'https://x.com/a.webp', altText: 'a' });
    await CommissionTier.create({ name: 'Tier', priceLabel: '$10', detailTag: 'Tag', description: 'd' });
    await FaqItem.create({ question: 'Q?', answer: 'A.' });
    await TosSection.create({ heading: 'H', points: ['p'] });

    const r = await request(app).get('/api/portfolio');
    expect(r.status).toBe(200);
    expect(r.body.success).toBe(true);
    expect(r.body.data.siteConfig.siteName).toBe('Test');
    expect(r.body.data.artworks).toHaveLength(1);
    expect(r.body.data.commissionTiers).toHaveLength(1);
    expect(r.body.data.faqItems).toHaveLength(1);
    expect(r.body.data.tosSections).toHaveLength(1);
  });

  it('GET returns empty arrays for collections with no data', async () => {
    await GlobalConfig.create(minConfig);

    const r = await request(app).get('/api/portfolio');
    expect(r.status).toBe(200);
    expect(r.body.data.artworks).toHaveLength(0);
    expect(r.body.data.commissionTiers).toHaveLength(0);
    expect(r.body.data.faqItems).toHaveLength(0);
    expect(r.body.data.tosSections).toHaveLength(0);
  });

  describe('caching headers', () => {
    it('allows caching but requires revalidation', async () => {
      const res = await request(app).get('/api/portfolio');
      expect(res.headers['cache-control']).toMatch(/public/);
      expect(res.headers['cache-control']).toMatch(/no-cache/);
    });

    it('never serves a stale window — a publish must be visible immediately', async () => {
      const res = await request(app).get('/api/portfolio');
      // max-age or stale-while-revalidate here means the admin re-reads its own
      // write and gets the pre-publish copy back, which looks like a failed publish.
      expect(res.headers['cache-control']).not.toMatch(/max-age=[1-9]/);
      expect(res.headers['cache-control']).not.toMatch(/stale-while-revalidate/);
    });

    it('carries an ETag so revalidation is a cheap 304', async () => {
      const res = await request(app).get('/api/portfolio');
      expect(res.headers.etag).toBeDefined();
    });

    it('applies to HEAD as well — CDNs and uptime checks use it', async () => {
      const res = await request(app).head('/api/portfolio');
      expect(res.headers['cache-control']).toMatch(/public/);
    });
  });
});
