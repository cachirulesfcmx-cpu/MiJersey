import {
  InvalidNavigationItemError,
  NavigationDepthExceededError,
} from '../errors/navigation.errors';
import { assertValidTreeDepth, toParentFirstOrder } from './navigation-tree.util';

describe('assertValidTreeDepth', () => {
  it('allows a tree within the max depth', () => {
    expect(() =>
      assertValidTreeDepth(
        [
          { id: 'a', parentId: null },
          { id: 'b', parentId: 'a' },
        ],
        3,
      ),
    ).not.toThrow();
  });

  it('throws NavigationDepthExceededError when a branch exceeds the max depth', () => {
    expect(() =>
      assertValidTreeDepth(
        [
          { id: 'a', parentId: null },
          { id: 'b', parentId: 'a' },
          { id: 'c', parentId: 'b' },
          { id: 'd', parentId: 'c' },
        ],
        3,
      ),
    ).toThrow(NavigationDepthExceededError);
  });

  it('throws InvalidNavigationItemError when a parent reference does not exist', () => {
    expect(() => assertValidTreeDepth([{ id: 'a', parentId: 'missing' }], 3)).toThrow(
      InvalidNavigationItemError,
    );
  });

  it('throws InvalidNavigationItemError on a cyclic reference', () => {
    expect(() =>
      assertValidTreeDepth(
        [
          { id: 'a', parentId: 'b' },
          { id: 'b', parentId: 'a' },
        ],
        5,
      ),
    ).toThrow(InvalidNavigationItemError);
  });
});

describe('toParentFirstOrder', () => {
  it('orders parents before their children', () => {
    const nodes = [
      { id: 'c', parentId: 'b' },
      { id: 'a', parentId: null },
      { id: 'b', parentId: 'a' },
    ];

    const ordered = toParentFirstOrder(nodes);

    expect(ordered.map((node) => node.id)).toEqual(['a', 'b', 'c']);
  });
});
