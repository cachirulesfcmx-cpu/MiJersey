import { InvalidSlugError } from '../errors/catalog.errors';
import { Slug } from './slug.vo';

describe('Slug', () => {
  it('normalizes valid slugs to lowercase and trimmed', () => {
    expect(Slug.create('  Camiseta-Local-2026  ').toString()).toBe('camiseta-local-2026');
  });

  it('rejects slugs with spaces or uppercase-only-invalid characters', () => {
    expect(() => Slug.create('camiseta local')).toThrow(InvalidSlugError);
  });

  it('rejects slugs with leading/trailing dashes', () => {
    expect(() => Slug.create('-camiseta-')).toThrow(InvalidSlugError);
  });

  it('rejects slugs with consecutive dashes', () => {
    expect(() => Slug.create('camiseta--local')).toThrow(InvalidSlugError);
  });
});
