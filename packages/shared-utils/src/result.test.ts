import { describe, expect, it } from 'vitest';
import { err, ok } from './result.js';

describe('Result', () => {
  it('wraps a success value', () => {
    const result = ok(42);
    expect(result).toEqual({ ok: true, value: 42 });
  });

  it('wraps an error value', () => {
    const result = err('failed');
    expect(result).toEqual({ ok: false, error: 'failed' });
  });
});
