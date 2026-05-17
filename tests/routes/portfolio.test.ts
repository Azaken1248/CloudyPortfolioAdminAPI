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
});
