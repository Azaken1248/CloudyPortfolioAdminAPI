import mongoose from 'mongoose';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { GlobalConfig, Artwork, CommissionTier, FaqItem, TosSection } from './models/index.js';

const defaultConfig = {
  siteConfig: {
    siteName: 'Cluwudy',
    siteSubtitle: 'portfolio',
    pageTitle: 'Cluwudy — Artist Portfolio',
    metaDescription: 'Original character art, fan art, and commission info by Cluwudy.',
    logoIcon: 'Cloud',
  },
  heroContent: {
    pillIcon: 'Palette',
    pillLabel: 'Original character introduction',
    eyebrow: 'Cluwudy',
    headline: 'Welcome to my portfolio.',
    body: 'I create original character art and commissions.',
    accent: 'Bringing characters to life.',
    image: 'https://res.cloudinary.com/placeholder/hero.webp',
    imageAlt: 'Cloudy PNGTuber character',
    statusPillLabel: 'Original character spotlight',
    ctaButtons: [
      { label: 'View artwork', href: '#gallery', variant: 'primary' as const, icon: 'Image' },
      { label: 'Request commission', href: '#contact', variant: 'secondary' as const },
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
      description: 'Everything you need to know before commissioning.',
    },
    faqHeading: 'Common questions',
    tosHeading: 'Terms of service',
    tosAcceptanceText: 'By commissioning me, you agree to the following terms of service.',
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
      notes: ['Include character references', 'Describe your idea clearly'],
    },
    form: {
      fields: [
        { name: 'name', label: 'Name', type: 'text' as const, placeholder: 'Your name' },
        { name: 'email', label: 'Email', type: 'email' as const, placeholder: 'you@example.com' },
        { name: 'message', label: 'Message', type: 'textarea' as const, placeholder: 'Describe your commission idea', rows: 6 },
      ],
      submitLabel: 'Send message',
      submitIcon: 'ArrowRight',
      disclaimer: 'Your information will only be used to respond to your inquiry.',
    },
  },
  footerContent: {
    copyright: '© 2026 Cluwudy. All rights reserved.',
    tagline: 'Made with love and lots of coffee.',
  },
  nav: [
    { id: 'home', label: 'Home', icon: 'House' },
    { id: 'gallery', label: 'Artwork', icon: 'Image' },
    { id: 'commissions', label: 'Commissions', icon: 'Palette' },
    { id: 'faq', label: 'FAQ & TOS', icon: 'ChatCircleText' },
    { id: 'contact', label: 'Contact', icon: 'Envelope' },
  ],
  socials: [
    { platform: 'instagram', url: 'https://instagram.com/', label: 'Instagram', icon: 'InstagramLogo' },
    { platform: 'twitter', url: 'https://twitter.com/', label: 'Twitter', icon: 'TwitterLogo' },
    { platform: 'discord', url: 'https://discord.gg/', label: 'Discord', icon: 'DiscordLogo' },
  ],
};

const defaultArtworks = [
  {
    title: 'Starfall OC',
    category: 'Original Character',
    description: 'A celestial-themed original character with flowing star-patterned hair.',
    imageUrl: 'https://res.cloudinary.com/placeholder/starfall.webp',
    altText: 'Starfall original character illustration',
    sortOrder: 0,
  },
  {
    title: 'Fischl Fan Art',
    category: 'Fan Art',
    description: 'A detailed fan art illustration of Fischl from Genshin Impact.',
    imageUrl: 'https://res.cloudinary.com/placeholder/fischl.webp',
    altText: 'Fischl fan art illustration',
    sortOrder: 1,
  },
  {
    title: 'Sunset Commission',
    category: 'Commission',
    description: 'A character commission featuring a warm sunset background.',
    imageUrl: 'https://res.cloudinary.com/placeholder/sunset.webp',
    altText: 'Sunset commission artwork',
    sortOrder: 2,
  },
];

const defaultTiers = [
  {
    name: 'Bust Sketch',
    priceLabel: '$25–$40',
    detailTag: 'Sketch / Lineart',
    description: 'A clean bust-level sketch with optional flat colors.',
    sortOrder: 0,
  },
  {
    name: 'Half-Body Illustration',
    priceLabel: '$60–$90',
    detailTag: 'Full Color / Shaded',
    description: 'Half-body illustration with full color rendering and simple background.',
    sortOrder: 1,
  },
  {
    name: 'Full Illustration',
    priceLabel: '$120–$180',
    detailTag: 'Full Render / Background',
    description: 'Complete character illustration with detailed background and effects.',
    sortOrder: 2,
  },
];

const defaultFaqs = [
  {
    question: 'How do I commission you?',
    answer: 'Reach out through the contact form or message me on Discord with your idea and references.',
    sortOrder: 0,
  },
  {
    question: 'What is your turnaround time?',
    answer: 'Typically 2–4 weeks depending on complexity and current queue.',
    sortOrder: 1,
  },
  {
    question: 'Do you offer revisions?',
    answer: 'Yes! Two rounds of revisions are included in every commission tier.',
    sortOrder: 2,
  },
];

const defaultTosSections = [
  {
    heading: 'General Terms',
    variant: 'default' as const,
    points: [
      'Commissioning me means you have read and accepted these terms.',
      'I reserve the right to decline any commission for any reason.',
      'Prices may vary depending on complexity.',
    ],
    sortOrder: 0,
  },
  {
    heading: 'Usage Rights',
    variant: 'info' as const,
    points: [
      'You may use the artwork for personal, non-commercial purposes.',
      'Commercial usage requires a separate license fee.',
      'I retain the right to post the artwork in my portfolio.',
    ],
    sortOrder: 1,
  },
  {
    heading: 'Prohibited',
    variant: 'prohibited' as const,
    points: [
      'Do not claim the artwork as your own.',
      'Do not use AI tools to modify or generate derivatives of the artwork.',
      'Do not remove my signature or watermark.',
    ],
    sortOrder: 2,
  },
];

async function seed(): Promise<void> {
  logger.info('[SEED] Connecting to MongoDB...');
  await mongoose.connect(env.MONGO_URI);
  logger.info('[SEED] Connected.');

  logger.info('[SEED] Dropping existing collections...');
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }

  logger.info('[SEED] Inserting GlobalConfig...');
  await GlobalConfig.create(defaultConfig);

  logger.info('[SEED] Inserting Artworks...');
  await Artwork.insertMany(defaultArtworks);

  logger.info('[SEED] Inserting Commission Tiers...');
  await CommissionTier.insertMany(defaultTiers);

  logger.info('[SEED] Inserting FAQ Items...');
  await FaqItem.insertMany(defaultFaqs);

  logger.info('[SEED] Inserting TOS Sections...');
  await TosSection.insertMany(defaultTosSections);

  logger.info('[SEED] Seed complete!');
  logger.info(`  GlobalConfig: 1`);
  logger.info(`  Artworks:     ${defaultArtworks.length}`);
  logger.info(`  Tiers:        ${defaultTiers.length}`);
  logger.info(`  FAQs:         ${defaultFaqs.length}`);
  logger.info(`  TOS:          ${defaultTosSections.length}`);

  await mongoose.disconnect();
  logger.info('[SEED] Disconnected. Done.');
}

seed().catch((err) => {
  logger.error('[SEED] Fatal error:', err);
  process.exit(1);
});
