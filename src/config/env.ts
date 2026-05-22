import 'dotenv/config';

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`[ENV] Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const env = {
  get PORT(): number {
    return parseInt(optionalEnv('PORT', '5000'), 10);
  },
  get NODE_ENV(): 'development' | 'production' | 'test' {
    return optionalEnv('NODE_ENV', 'development') as 'development' | 'production' | 'test';
  },

  get MONGO_URI(): string {
    return requireEnv('MONGO_URI');
  },

  get JWT_SECRET(): string {
    return requireEnv('JWT_SECRET');
  },
  get DISCORD_CLIENT_ID(): string {
    return requireEnv('DISCORD_CLIENT_ID');
  },
  get DISCORD_CLIENT_SECRET(): string {
    return requireEnv('DISCORD_CLIENT_SECRET');
  },
  get DISCORD_REDIRECT_URI(): string {
    return requireEnv('DISCORD_REDIRECT_URI');
  },
  get ALLOWED_DISCORD_IDS(): string[] {
    return requireEnv('ALLOWED_DISCORD_IDS')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
  },

  get CLOUDINARY_CLOUD_NAME(): string {
    return requireEnv('CLOUDINARY_CLOUD_NAME');
  },
  get CLOUDINARY_API_KEY(): string {
    return requireEnv('CLOUDINARY_API_KEY');
  },
  get CLOUDINARY_API_SECRET(): string {
    return requireEnv('CLOUDINARY_API_SECRET');
  },

  get CLIENT_URL(): string {
    return optionalEnv('CLIENT_URL', 'http://localhost:5173');
  },

  get ALLOWED_ORIGINS(): string[] {
    const origins = process.env.ALLOWED_ORIGINS;
    if (origins) {
      return origins.split(',').map((o) => o.trim()).filter(Boolean);
    }
    return [this.CLIENT_URL];
  },

  get IS_PRODUCTION(): boolean {
    return this.NODE_ENV === 'production';
  },
};

export type Env = typeof env;
