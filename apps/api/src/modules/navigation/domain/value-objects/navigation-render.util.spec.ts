import { NavigationItemType } from './navigation-enums';
import {
  buildNavigationTree,
  filterVisibleTree,
  type ResolvedNavigationNode,
} from './navigation-render.util';

function node(overrides: Partial<ResolvedNavigationNode> & { id: string }): ResolvedNavigationNode {
  return {
    parentId: null,
    label: overrides.id,
    type: NavigationItemType.LINK,
    href: `/${overrides.id}`,
    icon: null,
    sortOrder: 0,
    openInNewTab: false,
    visibilityRules: null,
    ...overrides,
  };
}

describe('buildNavigationTree', () => {
  it('nests children under their parent, sorted by sortOrder', () => {
    const nodes = [
      node({ id: 'b', sortOrder: 1 }),
      node({ id: 'a', sortOrder: 0 }),
      node({ id: 'a-1', parentId: 'a', sortOrder: 0 }),
    ];

    const tree = buildNavigationTree(nodes);

    expect(tree.map((item) => item.id)).toEqual(['a', 'b']);
    expect(tree[0]?.children.map((item) => item.id)).toEqual(['a-1']);
    expect(tree[1]?.children).toEqual([]);
  });
});

describe('filterVisibleTree', () => {
  it('keeps nodes without visibility rules', () => {
    const nodes = [node({ id: 'a' })];

    const visible = filterVisibleTree(nodes, { authenticated: false, device: null });

    expect(visible.map((n) => n.id)).toEqual(['a']);
  });

  it('hides a node whose authenticated rule does not match the context', () => {
    const nodes = [node({ id: 'a', visibilityRules: { authenticated: true } })];

    const visible = filterVisibleTree(nodes, { authenticated: false, device: null });

    expect(visible).toEqual([]);
  });

  it('hides descendants of a hidden node even without their own rules', () => {
    const nodes = [
      node({ id: 'a', visibilityRules: { authenticated: true } }),
      node({ id: 'a-1', parentId: 'a' }),
    ];

    const visible = filterVisibleTree(nodes, { authenticated: false, device: null });

    expect(visible).toEqual([]);
  });

  it('respects the devices rule', () => {
    const nodes = [node({ id: 'a', visibilityRules: { devices: ['mobile'] } })];

    expect(filterVisibleTree(nodes, { authenticated: false, device: 'mobile' })).toHaveLength(1);
    expect(filterVisibleTree(nodes, { authenticated: false, device: 'desktop' })).toHaveLength(0);
  });
});
