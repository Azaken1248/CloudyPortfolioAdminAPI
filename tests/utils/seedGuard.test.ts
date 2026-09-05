
import { describe, it, expect, vi, afterEach } from 'vitest';
import { describeTarget, assertSafeToSeed } from '../../src/utils/seedGuard.js';

/**
 * The seed script deletes every document in every collection, and MONGO_URI in
 * the committed .env points at production. This guard is the only thing between
 * a mistyped command and total data loss, so it is worth covering directly.
 */
afterEach(() => vi.restoreAllMocks());

function withExitCaptured(fn: () => void): number | 'did-not-exit' {
  let code: number | 'did-not-exit' = 'did-not-exit';
  const exit = vi.spyOn(process, 'exit').mockImplementation(((c?: number) => {
    code = c ?? 0;
    throw new Error('__exit__');
  }) as never);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  try { fn() } catch (e) { if ((e as Error).message !== '__exit__') throw e }
  exit.mockRestore();
  return code;
}

describe('describeTarget', () => {
  it('recognises a loopback target as local', () => {
    const t = describeTarget('mongodb://127.0.0.1:27017/cloudy');
    expect(t.isLocal).toBe(true);
    expect(t.host).toBe('127.0.0.1');
    expect(t.database).toBe('cloudy');
  });

  it('recognises localhost as local', () => {
    expect(describeTarget('mongodb://localhost:27017/x').isLocal).toBe(true);
  });

  it('treats an Atlas cluster as remote', () => {
    const t = describeTarget('mongodb+srv://u:p@cluster0.abc.mongodb.net/prod');
    expect(t.isLocal).toBe(false);
    expect(t.host).toBe('cluster0.abc.mongodb.net');
    expect(t.database).toBe('prod');
  });

  it('never exposes credentials from the URI', () => {
    const t = describeTarget('mongodb+srv://admin:sup3rsecret@cluster0.abc.mongodb.net/prod');
    expect(JSON.stringify(t)).not.toContain('sup3rsecret');
    expect(JSON.stringify(t)).not.toContain('admin');
  });

  it('fails closed on an unparseable URI', () => {
    expect(describeTarget('not a uri').isLocal).toBe(false);
  });
});

describe('assertSafeToSeed', () => {
  const remote = { host: 'cluster0.abc.mongodb.net', database: 'prod', isLocal: false };
  const local = { host: '127.0.0.1', database: 'cloudy_dev', isLocal: true };

  it('refuses a remote target without --force', () => {
    vi.stubEnv('NODE_ENV', 'development');
    process.argv = ['node', 'seed.ts'];
    expect(withExitCaptured(() => assertSafeToSeed(remote))).toBe(1);
  });

  it('allows a remote target when --force is given', () => {
    vi.stubEnv('NODE_ENV', 'development');
    process.argv = ['node', 'seed.ts', '--force'];
    expect(withExitCaptured(() => assertSafeToSeed(remote))).toBe('did-not-exit');
  });

  it('refuses in production even with --force', () => {
    vi.stubEnv('NODE_ENV', 'production');
    process.argv = ['node', 'seed.ts', '--force'];
    expect(withExitCaptured(() => assertSafeToSeed(remote))).toBe(1);
  });

  it('refuses a LOCAL target in production too', () => {
    vi.stubEnv('NODE_ENV', 'production');
    process.argv = ['node', 'seed.ts', '--force'];
    expect(withExitCaptured(() => assertSafeToSeed(local))).toBe(1);
  });

  it('allows a local target in development with no flag', () => {
    vi.stubEnv('NODE_ENV', 'development');
    process.argv = ['node', 'seed.ts'];
    expect(withExitCaptured(() => assertSafeToSeed(local))).toBe('did-not-exit');
  });
});
