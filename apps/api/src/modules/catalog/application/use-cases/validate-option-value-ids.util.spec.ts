import { ProductOptionEntity } from '../../domain/entities/product-option.entity';
import { ProductOptionValueEntity } from '../../domain/entities/product-option-value.entity';
import { validateOptionValueIds } from './validate-option-value-ids.util';

function buildOption(id: string, valueIds: string[]): ProductOptionEntity {
  return new ProductOptionEntity({
    id,
    productId: 'product-1',
    name: id,
    position: 0,
    values: valueIds.map(
      (valueId, index) =>
        new ProductOptionValueEntity({
          id: valueId,
          optionId: id,
          value: valueId,
          position: index,
        }),
    ),
  });
}

describe('validateOptionValueIds', () => {
  const options = [buildOption('size', ['s', 'm', 'l']), buildOption('color', ['red', 'blue'])];

  it('accepts one value per option', () => {
    expect(validateOptionValueIds(options, ['m', 'red'])).toBe(true);
  });

  it('rejects a wrong number of values', () => {
    expect(validateOptionValueIds(options, ['m'])).toBe(false);
    expect(validateOptionValueIds(options, ['m', 'red', 's'])).toBe(false);
  });

  it('rejects an unknown value id', () => {
    expect(validateOptionValueIds(options, ['m', 'green'])).toBe(false);
  });

  it('rejects two values from the same option', () => {
    expect(validateOptionValueIds(options, ['m', 's'])).toBe(false);
  });

  it('accepts an empty combination for a product with no options', () => {
    expect(validateOptionValueIds([], [])).toBe(true);
  });
});
