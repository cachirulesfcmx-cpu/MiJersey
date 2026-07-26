import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { CategoryEntity, type CategoryProps } from '../../domain/entities/category.entity';
import { CategoryCycleError, CategoryNotFoundError } from '../../domain/errors/taxonomy.errors';
import type { CategoryRepositoryPort } from '../../domain/ports/category.repository.port';
import { CategoryStatus } from '../../domain/value-objects/taxonomy-enums';
import { TaxonomyCacheService } from '../services/taxonomy-cache.service';
import { MoveCategoryUseCase } from './move-category.use-case';

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

function buildUseCase(categories: Map<string, CategoryEntity>) {
  const repo: jest.Mocked<CategoryRepositoryPort> = {
    findById: jest.fn((id: string) => Promise.resolve(categories.get(id) ?? null)),
    findBySlug: jest.fn(),
    existsBySlug: jest.fn(),
    findAll: jest.fn(),
    findPublicAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    move: jest.fn((id: string, parentId: string | null) =>
      Promise.resolve(buildCategory({ id, parentId })),
    ),
    reorder: jest.fn(),
    delete: jest.fn(),
    hasChildren: jest.fn(),
    assignProducts: jest.fn(),
    removeProduct: jest.fn(),
    listProductIds: jest.fn(),
  };
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };
  const cache = {
    invalidateCategoryTree: jest.fn().mockResolvedValue(undefined),
  } as unknown as TaxonomyCacheService;

  return { useCase: new MoveCategoryUseCase(repo, auditLog, cache), repo };
}

describe('MoveCategoryUseCase', () => {
  it('rejects moving a category under itself', async () => {
    const root = buildCategory({ id: 'root' });
    const { useCase } = buildUseCase(new Map([['root', root]]));

    await expect(
      useCase.execute({ id: 'root', parentId: 'root', actorUserId: 'staff-1', ipAddress: null }),
    ).rejects.toBeInstanceOf(CategoryCycleError);
  });

  it('rejects moving a category under its own descendant', async () => {
    const root = buildCategory({ id: 'root', parentId: null });
    const child = buildCategory({ id: 'child', parentId: 'root' });
    const { useCase } = buildUseCase(
      new Map([
        ['root', root],
        ['child', child],
      ]),
    );

    await expect(
      useCase.execute({ id: 'root', parentId: 'child', actorUserId: 'staff-1', ipAddress: null }),
    ).rejects.toBeInstanceOf(CategoryCycleError);
  });

  it('rejects moving to a parent that does not exist', async () => {
    const root = buildCategory({ id: 'root' });
    const { useCase } = buildUseCase(new Map([['root', root]]));

    await expect(
      useCase.execute({ id: 'root', parentId: 'missing', actorUserId: 'staff-1', ipAddress: null }),
    ).rejects.toBeInstanceOf(CategoryNotFoundError);
  });

  it('allows moving to an unrelated category', async () => {
    const root = buildCategory({ id: 'root', parentId: null });
    const other = buildCategory({ id: 'other', parentId: null });
    const { useCase, repo } = buildUseCase(
      new Map([
        ['root', root],
        ['other', other],
      ]),
    );

    await useCase.execute({
      id: 'root',
      parentId: 'other',
      actorUserId: 'staff-1',
      ipAddress: null,
    });

    expect(repo.move).toHaveBeenCalledWith('root', 'other');
  });
});
