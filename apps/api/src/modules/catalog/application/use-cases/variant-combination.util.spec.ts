import { cartesianProduct, computeCombinationKey } from './variant-combination.util';

describe('computeCombinationKey', () => {
  it('is stable regardless of input order', () => {
    expect(computeCombinationKey(['b', 'a', 'c'])).toBe(computeCombinationKey(['c', 'a', 'b']));
  });

  it('produces a comma-joined sorted string', () => {
    expect(computeCombinationKey(['id-2', 'id-1'])).toBe('id-1,id-2');
  });

  it('is empty for a product with no options', () => {
    expect(computeCombinationKey([])).toBe('');
  });
});

describe('cartesianProduct', () => {
  it('combines every value of every group exactly once', () => {
    const result = cartesianProduct([
      ['S', 'M'],
      ['Red', 'Blue'],
    ]);

    expect(result).toHaveLength(4);
    expect(result).toEqual(
      expect.arrayContaining([
        ['S', 'Red'],
        ['S', 'Blue'],
        ['M', 'Red'],
        ['M', 'Blue'],
      ]),
    );
  });

  it('returns a single empty combination for zero groups', () => {
    expect(cartesianProduct([])).toEqual([[]]);
  });

  it('returns nothing if any group is empty', () => {
    expect(cartesianProduct([['S', 'M'], []])).toEqual([]);
  });
});
