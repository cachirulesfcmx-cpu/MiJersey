import { InvalidSlugError } from '../errors/taxonomy.errors';
import { Slug } from './slug.vo';

describe('Slug', () => {
  it('normalizes valid slugs to lowercase and trimmed', () => {
    expect(Slug.create('  Playeras-Locales  ').toString()).toBe('playeras-locales');
  });

  it('rejects slugs with spaces', () => {
    expect(() => Slug.create('playeras locales')).toThrow(InvalidSlugError);
  });

  it('rejects slugs with consecutive dashes', () => {
    expect(() => Slug.create('playeras--locales')).toThrow(InvalidSlugError);
  });
});
