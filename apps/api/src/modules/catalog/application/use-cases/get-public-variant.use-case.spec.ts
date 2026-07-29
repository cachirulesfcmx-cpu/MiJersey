import type { MediaUsageService } from '../../../media/application/services/media-usage.service';
import { ProductEntity, type ProductProps } from '../../domain/entities/product.entity';
import {
  ProductVariantEntity,
  type ProductVariantProps,
} from '../../domain/entities/product-variant.entity';
import { ProductVariantNotFoundError } from '../../domain/errors/catalog.errors';
import type { InventoryAvailabilityPort } from '../../domain/ports/inventory-availability.port';
import type { ProductRepositoryPort } from '../../domain/ports/product.repository.port';
import type { ProductVariantRepositoryPort } from '../../domain/ports/product-variant.repository.port';
import {
  ProductStatus,
  ProductType,
  ProductVariantStatus,
  ProductVisibility,
} from '../../domain/value-objects/product-enums';
import { GetPublicVariantUseCase } from './get-public-variant.use-case';

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
    imageId: null,
    status: ProductVariantStatus.ACTIVE,
    optionValueIds: ['value-1'],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

function buildUseCase(
  variant: ProductVariantEntity | null,
  product: ProductEntity | null,
  availableQuantity: number,
) {
  const variants: jest.Mocked<ProductVariantRepositoryPort> = {
    findById: jest.fn().mockResolvedValue(variant),
    existsBySku: jest.fn(),
    existsBySlug: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
    findManyPublic: jest.fn(),
    bulkUpdate: jest.fn(),
    existingCombinationKeys: jest.fn(),
  };
  const products: jest.Mocked<ProductRepositoryPort> = {
    findById: jest.fn().mockResolvedValue(product),
    findBySlug: jest.fn(),
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
  const availability: jest.Mocked<InventoryAvailabilityPort> = {
    getAvailability: jest.fn().mockResolvedValue(new Map([['variant-1', availableQuantity]])),
  };
  const mediaUsage = {
    resolveUrls: jest.fn().mockResolvedValue(null),
  } as unknown as jest.Mocked<MediaUsageService>;

  return { useCase: new GetPublicVariantUseCase(variants, products, availability, mediaUsage) };
}

describe('GetPublicVariantUseCase', () => {
  it('throws when the variant does not exist', async () => {
    const { useCase } = buildUseCase(null, null, 0);

    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(ProductVariantNotFoundError);
  });

  it('throws when the variant is not ACTIVE', async () => {
    const { useCase } = buildUseCase(
      buildVariant({ status: ProductVariantStatus.ARCHIVED }),
      buildProduct(),
      5,
    );

    await expect(useCase.execute('variant-1')).rejects.toBeInstanceOf(ProductVariantNotFoundError);
  });

  it('throws when the parent product is not ACTIVE + PUBLIC', async () => {
    const { useCase } = buildUseCase(
      buildVariant(),
      buildProduct({ status: ProductStatus.DRAFT }),
      5,
    );

    await expect(useCase.execute('variant-1')).rejects.toBeInstanceOf(ProductVariantNotFoundError);
  });

  it('marks the variant as in stock when available quantity is positive', async () => {
    const { useCase } = buildUseCase(buildVariant(), buildProduct(), 3);

    const result = await useCase.execute('variant-1');

    expect(result).toMatchObject({ availableQuantity: 3, inStock: true });
  });

  it('marks the variant as out of stock when available quantity is zero', async () => {
    const { useCase } = buildUseCase(buildVariant(), buildProduct(), 0);

    const result = await useCase.execute('variant-1');

    expect(result).toMatchObject({ availableQuantity: 0, inStock: false });
  });
});
