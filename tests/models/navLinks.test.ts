
import { describe, it, expect } from 'vitest';
import { GlobalConfig } from '../../src/models/index.js';
import { MAX_NAV_LINKS } from '../../src/models/GlobalConfig.js';

/** Minimal valid config, extended per test. */
function baseConfig(navLinks: unknown[]): Record<string, unknown> {
  return {
    siteConfig: { siteName: 'S', siteSubtitle: 's', pageTitle: 'p', metaDescription: 'm', logoIcon: 'Cloud' },
    heroContent: {
      pillIcon: 'Star', pillLabel: 'p', eyebrow: 'e', headline: 'h', body: 'b',
      accent: 'a', image: 'https://x/i.webp', imageAlt: 'alt', statusPillLabel: 's', ctaButtons: [],
    },
    gallerySection: { eyebrow: 'e', title: 't', description: 'd' },
    commissions: { section: { eyebrow: 'e', title: 't', description: 'd' } },
    faqPage: { section: { eyebrow: 'e', title: 't', description: 'd' }, faqHeading: 'F', tosHeading: 'T', tosAcceptanceText: 'A' },
    contactContent: {
      section: { eyebrow: 'e', title: 't', description: 'd' },
      infoCard: { tag: 'g', title: 't', description: 'd', notes: [] },
      form: { fields: [], submitLabel: 'Send', disclaimer: 'D' },
    },
    footerContent: { copyright: 'c', tagline: 'tl' },
    nav: [], socials: [], navLinks,
  };
}

const link = (n: number) => ({ label: `L${n}`, url: `https://example.com/${n}`, icon: 'LinkSimple' });

describe('navLinks', () => {
  it('defaults to an empty list when omitted', async () => {
    const cfg = baseConfig([]) as Record<string, unknown>;
    delete cfg.navLinks;
    const saved = await GlobalConfig.create(cfg as never);
    expect(saved.navLinks).toEqual([]);
  });

  it(`accepts up to ${MAX_NAV_LINKS} links`, async () => {
    const links = Array.from({ length: MAX_NAV_LINKS }, (_, i) => link(i));
    const saved = await GlobalConfig.create(baseConfig(links) as never);
    expect(saved.navLinks).toHaveLength(MAX_NAV_LINKS);
  });

  it(`rejects more than ${MAX_NAV_LINKS}`, async () => {
    const links = Array.from({ length: MAX_NAV_LINKS + 1 }, (_, i) => link(i));
    await expect(GlobalConfig.create(baseConfig(links) as never)).rejects.toThrow(/more than/i);
  });

  it('requires label, url and icon on each link', async () => {
    await expect(
      GlobalConfig.create(baseConfig([{ label: 'only a label' }]) as never),
    ).rejects.toThrow(/required/i);
  });
});
