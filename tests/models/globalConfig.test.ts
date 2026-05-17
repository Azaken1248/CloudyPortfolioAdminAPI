
import { describe, it, expect } from 'vitest';
import { GlobalConfig } from '../../src/models/index.js';
import type {
  ISiteConfig,
  IHeroContent,
  ISectionContent,
  ICommissionsConfig,
  IFaqPageContent,
  IContactContent,
  IFooterContent,
  INavItem,
  ISocialLink,
} from '../../src/types/index.js';

interface GlobalConfigInput {
  siteConfig: ISiteConfig;
  heroContent: IHeroContent;
  gallerySection: ISectionContent;
  commissions: ICommissionsConfig;
  faqPage: IFaqPageContent;
  contactContent: IContactContent;
  footerContent: IFooterContent;
  nav: INavItem[];
  socials: ISocialLink[];
}

describe('GlobalConfig Model', () => {
  const validConfig: GlobalConfigInput = {
    siteConfig: {
      siteName: 'Cluwudy',
      siteSubtitle: 'portfolio',
      pageTitle: 'Cluwudy — Artist Portfolio',
      metaDescription: 'Original character art and commissions.',
      logoIcon: 'Cloud',
    },
    heroContent: {
      pillIcon: 'Palette',
      pillLabel: 'Original character introduction',
      eyebrow: 'Cluwudy',
      headline: 'Welcome to my portfolio.',
      body: 'I create original character art and commissions.',
      accent: 'Bringing characters to life.',
      image: 'https://res.cloudinary.com/test/hero.webp',
      imageAlt: 'Cloudy PNGTuber character',
      statusPillLabel: 'Original character spotlight',
      ctaButtons: [
        { label: 'View artwork', href: '#gallery', variant: 'primary', icon: 'Image' },
        { label: 'Request commission', href: '#contact', variant: 'secondary' },
      ],
    },
    gallerySection: {
      eyebrow: 'Artwork gallery',
      title: 'My recent work.',
      description: 'A collection of original characters and fan art.',
    },
    commissions: {
      section: {
        eyebrow: 'Commissions',
        title: 'Commission pricing.',
        description: 'Choose a tier that fits your needs.',
      },
      featured: {
        tag: 'Popular',
        badge: 'Best Value',
        title: 'Full Illustration',
        description: 'Complete character illustration with background.',
        highlights: ['Detailed rendering', 'Background included', 'Commercial rights'],
      },
    },
    faqPage: {
      section: {
        eyebrow: 'FAQ & TOS',
        title: 'Questions & terms.',
        description: 'Everything you need to know.',
      },
      faqHeading: 'Common questions',
      tosHeading: 'Terms of service',
      tosAcceptanceText: 'Commissioning me means you accept the TOS.',
    },
    contactContent: {
      section: {
        eyebrow: 'Contact',
        title: 'Get in touch.',
        description: 'Send me a message about your commission.',
      },
      infoCard: {
        tag: 'Info',
        title: 'Commission inquiries',
        description: 'I usually respond within 2 business days.',
        notes: ['Include references', 'Describe your idea'],
      },
      form: {
        fields: [
          { name: 'name', label: 'Name', type: 'text', placeholder: 'Your name' },
          { name: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
          { name: 'message', label: 'Message', type: 'textarea', placeholder: 'Describe your commission', rows: 6 },
        ],
        submitLabel: 'Send message',
        submitIcon: 'ArrowRight',
        disclaimer: 'Your info will only be used to respond to your inquiry.',
      },
    },
    footerContent: {
      copyright: '© 2026 Cluwudy. All rights reserved.',
      tagline: 'Made with love and lots of coffee.',
    },
    nav: [
      { id: 'home', label: 'Home', icon: 'House' },
      { id: 'gallery', label: 'Artwork', icon: 'Image' },
    ],
    socials: [
      { platform: 'instagram', url: 'https://instagram.com/', label: 'Instagram', icon: 'InstagramLogo' },
      { platform: 'discord', url: 'https://discord.gg/', label: 'Discord', icon: 'DiscordLogo' },
    ],
  };
  it('should create a complete GlobalConfig document', async () => {
    const config = await GlobalConfig.create(validConfig);

    expect(config._id).toBeDefined();
    expect(config.siteConfig.siteName).toBe('Cluwudy');
    expect(config.heroContent.ctaButtons).toHaveLength(2);
    expect(config.heroContent.ctaButtons[0].variant).toBe('primary');
    expect(config.gallerySection.eyebrow).toBe('Artwork gallery');
    expect(config.commissions.featured?.highlights).toHaveLength(3);
    expect(config.faqPage.faqHeading).toBe('Common questions');
    expect(config.contactContent.form.fields).toHaveLength(3);
    expect(config.footerContent.copyright).toContain('Cluwudy');
    expect(config.nav).toHaveLength(2);
    expect(config.socials).toHaveLength(2);
    expect(config.createdAt).toBeInstanceOf(Date);
    expect(config.updatedAt).toBeInstanceOf(Date);
  });
  it('should fail without siteConfig.siteName', async () => {
    const broken = JSON.parse(JSON.stringify(validConfig));
    delete broken.siteConfig.siteName;

    await expect(GlobalConfig.create(broken)).rejects.toThrow();
  });

  it('should fail without heroContent.headline', async () => {
    const broken = JSON.parse(JSON.stringify(validConfig));
    delete broken.heroContent.headline;

    await expect(GlobalConfig.create(broken)).rejects.toThrow();
  });

  it('should fail without gallerySection', async () => {
    const { gallerySection: _, ...noGallery } = validConfig;

    await expect(GlobalConfig.create(noGallery)).rejects.toThrow();
  });

  it('should fail without contactContent.form.submitLabel', async () => {
    const broken = JSON.parse(JSON.stringify(validConfig));
    delete broken.contactContent.form.submitLabel;

    await expect(GlobalConfig.create(broken)).rejects.toThrow();
  });
  it('should fail with invalid CTA variant', async () => {
    const broken = JSON.parse(JSON.stringify(validConfig));
    broken.heroContent.ctaButtons[0].variant = 'invalid';

    await expect(GlobalConfig.create(broken)).rejects.toThrow();
  });
  it('should fail with invalid form field type', async () => {
    const broken = JSON.parse(JSON.stringify(validConfig));
    broken.contactContent.form.fields[0].type = 'number';

    await expect(GlobalConfig.create(broken)).rejects.toThrow();
  });
  it('should support upsert for singleton pattern', async () => {
    await GlobalConfig.create(validConfig);

    const updated = await GlobalConfig.findOneAndUpdate(
      {},
      { $set: { 'siteConfig.siteName': 'UpdatedName' } },
      { returnDocument: 'after', upsert: true },
    );

    expect(updated?.siteConfig.siteName).toBe('UpdatedName');

    const count = await GlobalConfig.countDocuments();
    expect(count).toBe(1);
  });
  it('should create config without commissions.featured', async () => {
    const noFeatured = JSON.parse(JSON.stringify(validConfig));
    delete noFeatured.commissions.featured;

    const config = await GlobalConfig.create(noFeatured);
    expect(config.commissions.featured).toBeDefined();
  });

  it('should create config with empty nav and socials', async () => {
    const config = await GlobalConfig.create({ ...validConfig, nav: [], socials: [] });

    expect(config.nav).toHaveLength(0);
    expect(config.socials).toHaveLength(0);
  });
});
