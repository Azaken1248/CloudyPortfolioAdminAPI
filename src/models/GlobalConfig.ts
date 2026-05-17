import { Schema, model, type Document } from 'mongoose';
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
} from '../types/index.js';

export interface IGlobalConfigDocument extends Document {
  siteConfig: ISiteConfig;
  heroContent: IHeroContent;
  gallerySection: ISectionContent;
  commissions: ICommissionsConfig;
  faqPage: IFaqPageContent;
  contactContent: IContactContent;
  footerContent: IFooterContent;
  nav: INavItem[];
  socials: ISocialLink[];
  updatedAt: Date;
  createdAt: Date;
}

const CtaButtonSchema = new Schema(
  {
    label:   { type: String, required: true },
    href:    { type: String, required: true },
    variant: { type: String, enum: ['primary', 'secondary'], required: true },
    icon:    { type: String },
  },
  { _id: false },
);

const SectionContentSchema = new Schema(
  {
    eyebrow:     { type: String, required: true },
    title:       { type: String, required: true },
    description: { type: String, required: true },
  },
  { _id: false },
);

const FormFieldSchema = new Schema(
  {
    name:        { type: String, required: true },
    label:       { type: String, required: true },
    type:        { type: String, enum: ['text', 'email', 'textarea'], required: true },
    placeholder: { type: String, required: true },
    rows:        { type: Number },
  },
  { _id: false },
);

const NavItemSchema = new Schema(
  {
    id:    { type: String, required: true },
    label: { type: String, required: true },
    icon:  { type: String, required: true },
  },
  { _id: false },
);

const SocialLinkSchema = new Schema(
  {
    platform: { type: String, required: true },
    url:      { type: String, required: true },
    label:    { type: String, required: true },
    icon:     { type: String, required: true },
  },
  { _id: false },
);

const GlobalConfigSchema = new Schema<IGlobalConfigDocument>(
  {
    siteConfig: {
      siteName:        { type: String, required: true },
      siteSubtitle:    { type: String, required: true },
      pageTitle:       { type: String, required: true },
      metaDescription: { type: String, required: true },
      logoIcon:        { type: String, required: true },
    },

    heroContent: {
      pillIcon:        { type: String, required: true },
      pillLabel:       { type: String, required: true },
      eyebrow:         { type: String, required: true },
      headline:        { type: String, required: true },
      body:            { type: String, required: true },
      accent:          { type: String, required: true },
      image:           { type: String, required: true },
      imageAlt:        { type: String, required: true },
      statusPillLabel: { type: String, required: true },
      ctaButtons:      { type: [CtaButtonSchema], default: [] },
    },

    gallerySection: {
      type: SectionContentSchema,
      required: true,
    },

    commissions: {
      section:  { type: SectionContentSchema, required: true },
      featured: {
        tag:         { type: String },
        badge:       { type: String },
        title:       { type: String },
        description: { type: String },
        highlights:  { type: [String], default: [] },
      },
    },

    faqPage: {
      section:            { type: SectionContentSchema, required: true },
      faqHeading:         { type: String, required: true },
      tosHeading:         { type: String, required: true },
      tosAcceptanceText:  { type: String, required: true },
    },

    contactContent: {
      section: { type: SectionContentSchema, required: true },
      infoCard: {
        tag:         { type: String, required: true },
        title:       { type: String, required: true },
        description: { type: String, required: true },
        notes:       { type: [String], default: [] },
      },
      form: {
        fields:       { type: [FormFieldSchema], default: [] },
        submitLabel:  { type: String, required: true },
        submitIcon:   { type: String },
        disclaimer:   { type: String, required: true },
        actionUrl:    { type: String },
      },
    },

    footerContent: {
      copyright: { type: String, required: true },
      tagline:   { type: String, required: true },
    },

    nav:     { type: [NavItemSchema], default: [] },
    socials: { type: [SocialLinkSchema], default: [] },
  },
  {
    timestamps: true,
    collection: 'globalconfig',
  },
);

export const GlobalConfig = model<IGlobalConfigDocument>('GlobalConfig', GlobalConfigSchema);
