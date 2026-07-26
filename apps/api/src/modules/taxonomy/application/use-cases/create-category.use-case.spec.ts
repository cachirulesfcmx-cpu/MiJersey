import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { CategoryEntity, type CategoryProps } from '../../domain/entities/category.entity';
import {
  CategoryMaxDepthExceededError,
  CategorySlugAlreadyExistsError,
} from '../../domain/errors/taxonomy.errors';
import type { CategoryRepositoryPort } from '../../domain/ports/category.repository.port';
import { CategoryStatus } from '../../domain/value-objects/taxonomy-enums';
import { TaxonomyCacheService } from '../services/taxonomy-cache.service';
import { CreateCategoryUseCase } from './create-category.use-case';

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

function buildUseCase(categories: Map<string, CategoryEntity>, existsBySlug: boolean) {
  const repo: jest.Mocked<CategoryRepositoryPort> = {
    findById: jest.fn((id: string) => Promise.resolve(categories.get(id) ?? null)),
    findBySlug: jest.fn(),
    existsBySlug: jest.fn().mockResolvedValue(existsBySlug),
    findAll: jest.fn(),
    findPublicAll: jest.fn(),
    create: jest.fn((data) => Promise.resolve(buildCategory({ id: 'new-category', ...data }))),
    update: jest.fn(),
    move: jest.fn(),
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

  return { useCase: new CreateCategoryUseCase(repo, auditLog, cache), repo, auditLog };
}

describe('CreateCategoryUseCase', () => {
  it('rejects a duplicate slug', async () => {
    const { useCase } = buildUseCase(new Map(), true);

    await expect(
      useCase.execute({ name: 'Camisetas', actorUserId: 'staff-1', ipAddress: null }),
    ).rejects.toBeInstanceOf(CategorySlugAlreadyExistsError);
  });

  it('rejects creating beyond the maximum depth', async () => {
    const categories = new Map<string, CategoryEntity>();
    let parentId: string | null = null;
    for (let level = 0; level < 4; level += 1) {
      const id = `level-${level}`;
      categories.set(id, buildCategory({ id, parentId }));
      parentId = id;
    }
    // parentId ahora es "level-3", la 4ª categoría de la cadena; crear un hijo
    // suyo alcanzaría el límite de profundidad configurado (MAX_CATEGORY_DEPTH = 5).
    const { useCase } = buildUseCase(categories, false);

    await expect(
      useCase.execute({
        name: 'Demasiado profunda',
        parentId,
        actorUserId: 'staff-1',
        ipAddress: null,
      }),
    ).rejects.toBeInstanceOf(CategoryMaxDepthExceededError);
  });

  it('derives the slug from the name when none is given', async () => {
    const { useCase, repo } = buildUseCase(new Map(), false);

    await useCase.execute({ name: 'Camisetas Locales', actorUserId: 'staff-1', ipAddress: null });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'camisetas-locales' }),
    );
  });
});
