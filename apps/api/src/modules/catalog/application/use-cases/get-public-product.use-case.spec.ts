import type { AppConfig } from '../../../../config/env.schema';
import type { ListProductAttributesUseCase } from '../../../attributes/application/use-cases/list-product-attributes.use-case';
import type { MediaUsageService } from '../../../media/application/services/media-usage.service';
import type { GetSeoMetadataUseCase } from '../../../seo/application/use-cases/get-seo-metadata.use-case';
import { ProductEntity, type ProductProps } from '../../domain/entities/product.entity';
import { ProductOptionEntity } from '../../domain/entities/product-option.entity';
import { ProductOptionValueEntity } from '../../domain/entities/product-option-value.entity';
import {
  ProductVariantEntity,
  type ProductVariantProps,
} from '../../domain/entities/product-variant.entity';
import { ProductNotFoundError } from '../../domain/errors/catalog.errors';
import type { InventoryAvailabilityPort } from '../../domain/ports/inventory-availability.port';
import type { ProductRepositoryPort } from '../../domain/ports/product.repository.port';
import type { ProductDetailLookupPort } from '../../domain/ports/product-detail-lookup.port';
import type { ProductMediaRepositoryPort } from '../../domain/ports/product-media.repository.port';
import type { ProductOptionRepositoryPort } from '../../domain/ports/product-option.repository.port';
import type { ProductVariantRepositoryPort } from '../../domain/ports/product-variant.repository.port';
import {
  ProductStatus,
  ProductType,
  ProductVariantStatus,
  ProductVisibility,
} from '../../domain/value-objects/product-enums';
import { GetPublicProductUseCase } from './get-public-product.use-case';

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

function buildVariant(overrides: Partial<ProductVariantProps> = {}): ProductVariantEntity {
  return new ProductVariantEntity({
    id: 'variant-1',
    productId: 'product-1',
    sku: 'JERSEY-HOME-26-M',
    barcode: null,
    slug: 'jersey-local-2026-m',
    title: 'M',
    price: 999,
    compareAtPrice: null,
    weight: null,
    imageId: 'media-variant',
    status: ProductVariantStatus.ACTIVE,
    optionValueIds: ['value-1'],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

function buildUseCase(product: ProductEntity | null) {
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
  const option = new ProductOptionEntity({
    id: 'option-1',
    productId: 'product-1',
    name: 'Talla',
    position: 0,
    values: [
      new ProductOptionValueEntity({
        id: 'value-1',
        optionId: 'option-1',
        value: 'M',
        position: 0,
      }),
    ],
  });
  const options: jest.Mocked<ProductOptionRepositoryPort> = {
    findById: jest.fn(),
    findByProductId: jest.fn().mockResolvedValue([option]),
    existsByName: jest.fn(),
    create: jest.fn(),
    updateName: jest.fn(),
    replaceValues: jest.fn(),
    delete: jest.fn(),
    countVariantsUsingValue: jest.fn(),
  };
  const variants: jest.Mocked<ProductVariantRepositoryPort> = {
    findById: jest.fn(),
    existsBySku: jest.fn(),
    existsBySlug: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
    findManyPublic: jest.fn().mockResolvedValue({ items: [buildVariant()], total: 1 }),
    bulkUpdate: jest.fn(),
    existingCombinationKeys: jest.fn(),
  };
  const media: jest.Mocked<ProductMediaRepositoryPort> = {
    list: jest.fn().mockResolvedValue([{ mediaId: 'media-gallery', sortOrder: 0 }]),
    replaceAll: jest.fn(),
  };
  const lookup: jest.Mocked<ProductDetailLookupPort> = {
    findProductRelations: jest
      .fn()
      .mockResolvedValue({ brandId: 'brand-1', categoryIds: ['cat-1'] }),
    findBrandSummary: jest.fn().mockResolvedValue({
      id: 'brand-1',
      slug: 'nike',
      name: 'Nike',
      logoMediaId: 'media-logo',
    }),
    findCategorySummaries: jest
      .fn()
      .mockResolvedValue([{ id: 'cat-1', slug: 'playeras', name: 'Playeras' }]),
  };
  const availability: jest.Mocked<InventoryAvailabilityPort> = {
    getAvailability: jest.fn().mockResolvedValue(new Map([['variant-1', 4]])),
  };
  const mediaUsage = {
    resolveUrls: jest
      .fn()
      .mockImplementation((id: string) =>
        Promise.resolve({ url: `https://cdn.test/${id}.jpg`, thumbnailUrl: null }),
      ),
  } as unknown as jest.Mocked<MediaUsageService>;
  const seoMetadata = {
    execute: jest.fn().mockResolvedValue(null),
  } as unknown as jest.Mocked<GetSeoMetadataUseCase>;
  const productAttributes = {
    execute: jest.fn().mockResolvedValue([]),
  } as unknown as jest.Mocked<ListProductAttributesUseCase>;
  const config = { publicWebUrl: 'https://mijersey.test' } as AppConfig;

  return {
    useCase: new GetPublicProductUseCase(
      products,
      options,
      variants,
      media,
      lookup,
      availability,
      mediaUsage,
      seoMetadata,
      productAttributes,
      config,
    ),
  };
}

describe('GetPublicProductUseCase', () => {
  it('throws when the product does not exist or is not public', async () => {
    const { useCase } = buildUseCase(null);

    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(ProductNotFoundError);
  });

  it('builds the enriched public view with brand, categories, gallery and variants', async () => {
    const { useCase } = buildUseCase(buildProduct());

    const result = await useCase.execute('jersey-local-2026');

    expect(result.brand).toMatchObject({
      id: 'brand-1',
      logoUrl: 'https://cdn.test/media-logo.jpg',
    });
    expect(result.categories).toEqual([{ id: 'cat-1', slug: 'playeras', name: 'Playeras' }]);
    expect(result.galleryUrls).toEqual(['https://cdn.test/media-gallery.jpg']);
    expect(result.options).toEqual([
      {
        id: 'option-1',
        name: 'Talla',
        position: 0,
        values: [{ id: 'value-1', value: 'M', position: 0 }],
      },
    ]);
    expect(result.variants).toEqual([
      expect.objectContaining({
        id: 'variant-1',
        availableQuantity: 4,
        inStock: true,
        imageUrl: 'https://cdn.test/media-variant.jpg',
      }),
    ]);
    expect(result.seo.canonicalUrl).toBe('https://mijersey.test/products/jersey-local-2026');
  });
});
