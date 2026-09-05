import { env } from '../config/env.js';
import { logger } from './logger.js';

const LOCAL_DB_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '0.0.0.0']);

export type SeedTarget = {
  host: string;
  database: string;
  isLocal: boolean;
};

export function describeTarget(uri: string): SeedTarget {
  try {
    const parsed = new URL(uri);
    return {
      host: parsed.hostname,
      database: parsed.pathname.replace(/^\//, '') || '(cluster default)',
      isLocal: LOCAL_DB_HOSTS.has(parsed.hostname),
    };
  } catch {
    return { host: '(unparseable MONGO_URI)', database: '(unknown)', isLocal: false };
  }
}

/**
 * seed() deletes every document in every collection. Never do that to a production
 * database, and make a remote target an explicit choice rather than a default.
 */
export function assertSafeToSeed(target: SeedTarget): void {
  if (env.IS_PRODUCTION) {
    logger.error('[SEED] Refusing to run: NODE_ENV=production.');
    logger.error('[SEED] This script deletes every document in every collection.');
    process.exit(1);
  }

  if (!target.isLocal && !process.argv.includes('--force')) {
    logger.error(`[SEED] Refusing to run against remote database: ${target.host}/${target.database}`);
    logger.error('[SEED] This script deletes every document in every collection.');
    logger.error('[SEED] If that is genuinely what you want, re-run with:  npm run seed -- --force');
    process.exit(1);
  }
}

