import { CategoryEntity, type CategoryProps } from '../../domain/entities/category.entity';
import type { CategoryRepositoryPort } from '../../domain/ports/category.repository.port';
import { CategoryStatus } from '../../domain/value-objects/taxonomy-enums';
import { buildTree, computeDepth, wouldCreateCycle } from './category-tree.util';

function buildCategory(overrides: Partial<CategoryProps> = {}): CategoryEntity {
  return new CategoryEntity({
    id: 'category-1',
    parentId: null,
    slug: 'category-1',
    name: 'Category 1',
    description: null,
    image: null,
    sortOrder: 0,
    status: CategoryStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

function buildRepo(categories: CategoryEntity[]): CategoryRepositoryPort {
  const byId = new Map(categories.map((category) => [category.id, category]));
  return {
    findById: jest.fn((id: string) => Promise.resolve(byId.get(id) ?? null)),
  } as unknown as CategoryRepositoryPort;
}

describe('computeDepth', () => {
  it('is 1 for a root category (cuenta el nodo mismo)', async () => {
    const repo = buildRepo([buildCategory({ id: 'root', parentId: null })]);
    expect(await computeDepth(repo, 'root')).toBe(1);
  });

  it('is 0 for `null` (la raíz virtual, usada al crear categorías raíz)', async () => {
    const repo = buildRepo([]);
    expect(await computeDepth(repo, null)).toBe(0);
  });

  it('increases by one per ancestor', async () => {
    const root = buildCategory({ id: 'root', parentId: null });
    const child = buildCategory({ id: 'child', parentId: 'root' });
    const grandchild = buildCategory({ id: 'grandchild', parentId: 'child' });
    const repo = buildRepo([root, child, grandchild]);

    expect(await computeDepth(repo, 'grandchild')).toBe(3);
  });
});

describe('wouldCreateCycle', () => {
  it('detects moving a category under its own descendant', async () => {
    const root = buildCategory({ id: 'root', parentId: null });
    const child = buildCategory({ id: 'child', parentId: 'root' });
    const repo = buildRepo([root, child]);

    expect(await wouldCreateCycle(repo, 'root', 'child')).toBe(true);
  });

  it('allows moving to an unrelated category', async () => {
    const root = buildCategory({ id: 'root', parentId: null });
    const other = buildCategory({ id: 'other', parentId: null });
    const repo = buildRepo([root, other]);

    expect(await wouldCreateCycle(repo, 'root', 'other')).toBe(false);
  });
});

describe('buildTree', () => {
  it('nests children under their parent, ordered by sortOrder', () => {
    const root = buildCategory({ id: 'root', parentId: null, sortOrder: 0 });
    const second = buildCategory({ id: 'second', parentId: null, sortOrder: 1 });
    const childB = buildCategory({ id: 'child-b', parentId: 'root', sortOrder: 1 });
    const childA = buildCategory({ id: 'child-a', parentId: 'root', sortOrder: 0 });

    const tree = buildTree([second, childB, root, childA]);

    expect(tree.map((node) => node.category.id)).toEqual(['root', 'second']);
    expect(tree[0]?.children.map((node) => node.category.id)).toEqual(['child-a', 'child-b']);
  });
});
