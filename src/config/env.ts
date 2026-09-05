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

/**
 * Touch every required variable so a misconfigured deploy fails at startup
 * rather than at the first request that happens to need one.
 *
 * The getters above are lazy, which meant MONGO_URI and the Cloudinary keys
 * failed early only by accident (connectDB, and cloudinary.config at import),
 * while JWT_SECRET and the Discord credentials were not read until someone
 * tried to log in — long after the process reported itself healthy.
 *
 * Reports every missing variable at once instead of one per restart.
 */
export function validateEnv(): void {
  const required: (keyof typeof env)[] = [
    'MONGO_URI',
    'JWT_SECRET',
    'DISCORD_CLIENT_ID',
    'DISCORD_CLIENT_SECRET',
    'DISCORD_REDIRECT_URI',
    'ALLOWED_DISCORD_IDS',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
  ];

  const missing: string[] = [];

  for (const key of required) {
    try {
      void env[key];
    } catch {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `[ENV] Missing required environment variable${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`,
    );
  }
}

export type Env = typeof env;
