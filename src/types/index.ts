export interface ISocialLink {
  platform: string;
  url: string;
  label: string;
  icon: string;
}

export interface INavItem {
  id: string;
  label: string;
  icon: string;
}

export interface ICtaButton {
  label: string;
  href: string;
  variant: 'primary' | 'secondary';
  icon?: string;
}

export interface ISiteConfig {
  siteName: string;
  siteSubtitle: string;
  pageTitle: string;
  metaDescription: string;
  logoIcon: string;
}

export interface IHeroContent {
  pillIcon: string;
  pillLabel: string;
  eyebrow: string;
  headline: string;
  body: string;
  accent: string;
  image: string;
  imageAlt: string;
  statusPillLabel: string;
  ctaButtons: ICtaButton[];
}

export interface ISectionContent {
  eyebrow: string;
  title: string;
  description: string;
}

export interface ICommissionFeatured {
  tag: string;
  badge: string;
  title: string;
  description: string;
  highlights: string[];
}

export interface ICommissionsConfig {
  section: ISectionContent;
  featured?: ICommissionFeatured;
}

export interface IFormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'textarea';
  placeholder: string;
  rows?: number;
}

export interface IContactContent {
  section: ISectionContent;
  infoCard: {
    tag: string;
    title: string;
    description: string;
    notes: string[];
  };
  form: {
    fields: IFormField[];
    submitLabel: string;
    submitIcon?: string;
    disclaimer: string;
    actionUrl?: string;
  };
}

export interface IFaqPageContent {
  section: ISectionContent;
  faqHeading: string;
  tosHeading: string;
  tosAcceptanceText: string;
}

export interface IFooterContent {
  copyright: string;
  tagline: string;
}

export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    stack?: string;
  };
}
