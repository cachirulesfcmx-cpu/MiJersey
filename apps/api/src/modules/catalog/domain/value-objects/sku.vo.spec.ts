import { InvalidSkuError } from '../errors/catalog.errors';
import { Sku } from './sku.vo';

describe('Sku', () => {
  it('normalizes valid SKUs to uppercase and trimmed', () => {
    expect(Sku.create('  jersey-home-26  ').toString()).toBe('JERSEY-HOME-26');
  });

  it('rejects SKUs shorter than 3 characters', () => {
    expect(() => Sku.create('AB')).toThrow(InvalidSkuError);
  });

  it('rejects SKUs with invalid characters', () => {
    expect(() => Sku.create('SKU_WITH_UNDERSCORE')).toThrow(InvalidSkuError);
  });
});
