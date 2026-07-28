import { GetSeoMetadataUseCase } from '../../../seo/application/use-cases/get-seo-metadata.use-case';
import { CategoryEntity } from '../../domain/entities/category.entity';
import { CategoryNotFoundError } from '../../domain/errors/taxonomy.errors';
import type { CategoryRepositoryPort } from '../../domain/ports/category.repository.port';
import { CategoryStatus } from '../../domain/value-objects/taxonomy-enums';
import { GetCategoryPathUseCase } from './get-category-path.use-case';
import { GetPublicCategoryUseCase } from './get-public-category.use-case';

function buildCategory(overrides: Partial<Record<string, unknown>> = {}): CategoryEntity {
  return new CategoryEntity({
    id: 'cat-1',
    parentId: null,
    slug: 'ropa',
    name: 'Ropa',
    description: null,
    image: null,
    sortOrder: 0,
    status: CategoryStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

function buildUseCase(category: CategoryEntity | null) {
  const categories: jest.Mocked<CategoryRepositoryPort> = {
    findById: jest.fn(),
    findBySlug: jest.fn().mockResolvedValue(category),
    existsBySlug: jest.fn(),
    findAll: jest.fn(),
    findPublicAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    move: jest.fn(),
    reorder: jest.fn(),
    delete: jest.fn(),
    hasChildren: jest.fn(),
    assignProducts: jest.fn(),
    removeProduct: jest.fn(),
    listProductIds: jest.fn(),
  };
  const getCategoryPath = {
    execute: jest.fn().mockResolvedValue(category ? [category] : []),
  } as unknown as jest.Mocked<GetCategoryPathUseCase>;
  const seoMetadata = {
    execute: jest.fn().mockResolvedValue(null),
  } as unknown as jest.Mocked<GetSeoMetadataUseCase>;
  const config = { publicWebUrl: 'http://localhost:3000' } as { publicWebUrl: string };

  return {
    useCase: new GetPublicCategoryUseCase(
      categories,
      getCategoryPath,
      seoMetadata,
      config as never,
    ),
    getCategoryPath,
  };
}

describe('GetPublicCategoryUseCase', () => {
  it('throws when the category does not exist', async () => {
    const { useCase } = buildUseCase(null);

    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(CategoryNotFoundError);
  });

  it('throws when the category is not ACTIVE', async () => {
    const { useCase } = buildUseCase(buildCategory({ status: CategoryStatus.HIDDEN }));

    await expect(useCase.execute('ropa')).rejects.toBeInstanceOf(CategoryNotFoundError);
  });

  it('builds breadcrumbs from the ancestor path and attaches an auto-generated seo view', async () => {
    const category = buildCategory();
    const { useCase } = buildUseCase(category);

    const view = await useCase.execute('ropa');

    expect(view.breadcrumbs).toEqual([{ id: 'cat-1', slug: 'ropa', name: 'Ropa' }]);
    expect(view.seo.metaTitle).toBe('Ropa');
    expect(view.seo.canonicalUrl).toBe('http://localhost:3000/categories/ropa');
  });
});
