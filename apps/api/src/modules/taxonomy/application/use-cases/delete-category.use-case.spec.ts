import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { CategoryEntity, type CategoryProps } from '../../domain/entities/category.entity';
import {
  CategoryHasChildrenError,
  CategoryNotFoundError,
} from '../../domain/errors/taxonomy.errors';
import type { CategoryRepositoryPort } from '../../domain/ports/category.repository.port';
import { CategoryStatus } from '../../domain/value-objects/taxonomy-enums';
import { TaxonomyCacheService } from '../services/taxonomy-cache.service';
import { DeleteCategoryUseCase } from './delete-category.use-case';

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

function buildUseCase(category: CategoryEntity | null, hasChildren: boolean) {
  const repo: jest.Mocked<CategoryRepositoryPort> = {
    findById: jest.fn().mockResolvedValue(category),
    findBySlug: jest.fn(),
    existsBySlug: jest.fn(),
    findAll: jest.fn(),
    findPublicAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    move: jest.fn(),
    reorder: jest.fn(),
    delete: jest.fn().mockResolvedValue(undefined),
    hasChildren: jest.fn().mockResolvedValue(hasChildren),
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

  return { useCase: new DeleteCategoryUseCase(repo, auditLog, cache), repo };
}

describe('DeleteCategoryUseCase', () => {
  it('rejects deleting a category that has children', async () => {
    const { useCase } = buildUseCase(buildCategory(), true);

    await expect(
      useCase.execute({ id: 'category-1', actorUserId: 'staff-1', ipAddress: null }),
    ).rejects.toBeInstanceOf(CategoryHasChildrenError);
  });

  it('rejects deleting a category that does not exist', async () => {
    const { useCase } = buildUseCase(null, false);

    await expect(
      useCase.execute({ id: 'missing', actorUserId: 'staff-1', ipAddress: null }),
    ).rejects.toBeInstanceOf(CategoryNotFoundError);
  });

  it('deletes a childless category', async () => {
    const { useCase, repo } = buildUseCase(buildCategory(), false);

    await useCase.execute({ id: 'category-1', actorUserId: 'staff-1', ipAddress: null });

    expect(repo.delete).toHaveBeenCalledWith('category-1');
  });
});
