import { dateRangeCacheParams, resolveDateRange } from './date-range.util';

describe('resolveDateRange', () => {
  it('defaults to the last 30 days when no input is given', () => {
    const range = resolveDateRange({});
    const spanDays = (range.to.getTime() - range.from.getTime()) / (24 * 60 * 60 * 1000);
    expect(spanDays).toBeCloseTo(30, 0);
  });

  it('uses the provided from/to dates', () => {
    const range = resolveDateRange({ from: '2026-01-01', to: '2026-01-10' });
    expect(range.from.toISOString().slice(0, 10)).toBe('2026-01-01');
    expect(range.to.toISOString().slice(0, 10)).toBe('2026-01-10');
  });

  it('throws when from/to are not valid dates', () => {
    expect(() => resolveDateRange({ from: 'not-a-date' })).toThrow(RangeError);
  });

  it('throws when from is after to', () => {
    expect(() => resolveDateRange({ from: '2026-02-01', to: '2026-01-01' })).toThrow(RangeError);
  });

  it('throws when the range exceeds 366 days', () => {
    expect(() => resolveDateRange({ from: '2024-01-01', to: '2026-01-01' })).toThrow(RangeError);
  });
});

describe('dateRangeCacheParams', () => {
  it('serializes the range as ISO strings', () => {
    const range = resolveDateRange({ from: '2026-01-01', to: '2026-01-10' });
    expect(dateRangeCacheParams(range)).toEqual({
      from: range.from.toISOString(),
      to: range.to.toISOString(),
    });
  });
});
