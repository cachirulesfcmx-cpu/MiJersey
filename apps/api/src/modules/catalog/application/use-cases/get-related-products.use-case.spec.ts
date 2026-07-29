import { SearchProductsUseCase } from '../../../attributes/application/use-cases/search-products.use-case';
import { ProductEntity, type ProductProps } from '../../domain/entities/product.entity';
import { ProductNotFoundError } from '../../domain/errors/catalog.errors';
import type { ProductRepositoryPort } from '../../domain/ports/product.repository.port';
import type {
  ProductDetailLookupPort,
  ProductRelations,
} from '../../domain/ports/product-detail-lookup.port';
import {
  ProductStatus,
  ProductType,
  ProductVisibility,
} from '../../domain/value-objects/product-enums';
import { GetRelatedProductsUseCase } from './get-related-products.use-case';

function buildProduct(overrides: Partial<ProductProps> = {}): ProductEntity {
  return new ProductEntity({
    id: 'product-1',
    sku: 'JERSEY-HOME-26',
    slug: 'jersey-local-2026',
    name: 'Jersey Local 2026',
    shortDescription: null,
    description: null,
    status: ProductStatus.ACTIVE,
    visibility: ProductVisibility.PUBLIC,
    type: ProductType.PHYSICAL,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

function buildUseCase(product: ProductEntity | null, relations: ProductRelations) {
  const products: jest.Mocked<ProductRepositoryPort> = {
    findById: jest.fn(),
    findBySlug: jest.fn().mockResolvedValue(product),
    existsBySku: jest.fn(),
    existsBySlug: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    bulkUpdateStatus: jest.fn(),
    softDelete: jest.fn(),
    bulkSoftDelete: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  };
  const lookup: jest.Mocked<ProductDetailLookupPort> = {
    findProductRelations: jest.fn().mockResolvedValue(relations),
    findBrandSummary: jest.fn(),
    findCategorySummaries: jest.fn(),
  };
  const searchProducts: jest.Mocked<Pick<SearchProductsUseCase, 'execute'>> = {
    execute: jest.fn().mockResolvedValue({ items: [], total: 0 }),
  };

  return {
    useCase: new GetRelatedProductsUseCase(
      products,
      lookup,
      searchProducts as unknown as SearchProductsUseCase,
    ),
    searchProducts,
  };
}

describe('GetRelatedProductsUseCase', () => {
  it('throws when the product does not exist or is not public', async () => {
    const { useCase } = buildUseCase(null, { brandId: null, categoryIds: [] });

    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(ProductNotFoundError);
  });

  it('scopes by the first category when the product has one', async () => {
    const { useCase, searchProducts } = buildUseCase(buildProduct(), {
      brandId: 'brand-1',
      categoryIds: ['cat-1', 'cat-2'],
    });

    await useCase.execute('jersey-local-2026');

    expect(searchProducts.execute).toHaveBeenCalledWith(
      expect.objectContaining({ categoryId: 'cat-1', excludeProductId: 'product-1' }),
    );
  });

  it('falls back to brand scope when the product has no category', async () => {
    const { useCase, searchProducts } = buildUseCase(buildProduct(), {
      brandId: 'brand-1',
      categoryIds: [],
    });

    await useCase.execute('jersey-local-2026');

    expect(searchProducts.execute).toHaveBeenCalledWith(
      expect.objectContaining({ brandId: 'brand-1', excludeProductId: 'product-1' }),
    );
  });

  it('returns an empty list without querying when there is no category or brand', async () => {
    const { useCase, searchProducts } = buildUseCase(buildProduct(), {
      brandId: null,
      categoryIds: [],
    });

    const result = await useCase.execute('jersey-local-2026');

    expect(result).toEqual([]);
    expect(searchProducts.execute).not.toHaveBeenCalled();
  });
});
