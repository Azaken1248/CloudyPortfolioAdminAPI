
import { describe, it, expect, vi, afterEach } from 'vitest';
import { logger } from '../../src/utils/logger.js';

function capture(method: 'info' | 'warn' | 'error' | 'debug') {
  const target = method === 'info' ? 'info' : method === 'warn' ? 'warn' : method === 'debug' ? 'debug' : 'error';
  return vi.spyOn(console, target as 'log').mockImplementation(() => {});
}

afterEach(() => vi.restoreAllMocks());

describe('logger', () => {
  it('serialises an Error with its message, not as an empty object', () => {
    const spy = capture('error');
    logger.error('[TEST] failed:', new Error('the actual reason'));

    const output = spy.mock.calls[0].join(' ');
    // JSON.stringify(err) is '{}' because message/stack are non-enumerable,
    // which previously discarded the useful half of every logged failure.
    expect(output).toContain('the actual reason');
    expect(output).not.toContain('[{}]');
  });

  it('includes the error name', () => {
    const spy = capture('error');
    logger.error('[TEST]', new TypeError('wrong type'));
    expect(spy.mock.calls[0].join(' ')).toContain('TypeError');
  });

  it('still renders plain values', () => {
    const spy = capture('info');
    logger.info('[TEST] count:', 42, 'and', { a: 1 });
    const out = spy.mock.calls[0].join(' ');
    expect(out).toContain('42');
    expect(out).toContain('{"a":1}');
  });

  it('suppresses debug output in production', () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const spy = capture('debug');
      logger.debug('[TEST] noisy');
      expect(spy).not.toHaveBeenCalled();
    } finally {
      process.env.NODE_ENV = prev;
    }
  });

  it('does not throw on a circular structure', () => {
    const spy = capture('info');
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(() => logger.info('[TEST]', circular)).not.toThrow();
    expect(spy).toHaveBeenCalled();
  });
});
