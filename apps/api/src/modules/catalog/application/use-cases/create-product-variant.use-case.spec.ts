import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { ProductEntity, type ProductProps } from '../../domain/entities/product.entity';
import { ProductOptionEntity } from '../../domain/entities/product-option.entity';
import { ProductOptionValueEntity } from '../../domain/entities/product-option-value.entity';
import {
  ProductVariantEntity,
  type ProductVariantProps,
} from '../../domain/entities/product-variant.entity';
import {
  DuplicateVariantCombinationError,
  InvalidVariantOptionValuesError,
  VariantSkuAlreadyExistsError,
} from '../../domain/errors/catalog.errors';
import type { ProductRepositoryPort } from '../../domain/ports/product.repository.port';
import type { ProductOptionRepositoryPort } from '../../domain/ports/product-option.repository.port';
import type { ProductVariantRepositoryPort } from '../../domain/ports/product-variant.repository.port';
import {
  ProductStatus,
  ProductType,
  ProductVariantStatus,
  ProductVisibility,
} from '../../domain/value-objects/product-enums';
import { CreateProductVariantUseCase } from './create-product-variant.use-case';

function buildProduct(overrides: Partial<ProductProps> = {}): ProductEntity {
  return new ProductEntity({
    id: 'product-1',
    sku: 'JERSEY',
    slug: 'jersey',
    name: 'Jersey',
    shortDescription: null,
    description: null,
    status: ProductStatus.DRAFT,
    visibility: ProductVisibility.HIDDEN,
    type: ProductType.PHYSICAL,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

function buildOption(): ProductOptionEntity {
  return new ProductOptionEntity({
    id: 'size',
    productId: 'product-1',
    name: 'Talla',
    position: 0,
    values: [
      new ProductOptionValueEntity({ id: 'size-s', optionId: 'size', value: 'S', position: 0 }),
    ],
  });
}

function buildVariant(overrides: Partial<ProductVariantProps> = {}): ProductVariantEntity {
  return new ProductVariantEntity({
    id: 'variant-1',
    productId: 'product-1',
    sku: 'JERSEY-S',
    barcode: null,
    slug: 'jersey-s',
    title: 'S',
    price: 10,
    compareAtPrice: null,
    weight: null,
    imageId: null,
    status: ProductVariantStatus.ACTIVE,
    optionValueIds: ['size-s'],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

function buildUseCase(existingKeys: Set<string>, existsBySku = false, existsBySlug = false) {
  const products = {
    findById: jest.fn().mockResolvedValue(buildProduct()),
  } as unknown as jest.Mocked<ProductRepositoryPort>;
  const options = {
    findByProductId: jest.fn().mockResolvedValue([buildOption()]),
  } as unknown as jest.Mocked<ProductOptionRepositoryPort>;
  const variants: jest.Mocked<ProductVariantRepositoryPort> = {
    findById: jest.fn(),
    existsBySku: jest.fn().mockResolvedValue(existsBySku),
    existsBySlug: jest.fn().mockResolvedValue(existsBySlug),
    create: jest.fn().mockResolvedValue(buildVariant()),
    createMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
    findManyPublic: jest.fn(),
    bulkUpdate: jest.fn(),
    existingCombinationKeys: jest.fn().mockResolvedValue(existingKeys),
  };
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  return {
    useCase: new CreateProductVariantUseCase(products, options, variants, auditLog),
    variants,
  };
}

describe('CreateProductVariantUseCase', () => {
  it('rejects a combination that does not match the product options', async () => {
    const { useCase } = buildUseCase(new Set());

    await expect(
      useCase.execute({
        productId: 'product-1',
        sku: 'JERSEY-X',
        title: 'X',
        price: 10,
        optionValueIds: [],
        actorUserId: 'staff-1',
        ipAddress: null,
      }),
    ).rejects.toBeInstanceOf(InvalidVariantOptionValuesError);
  });

  it('rejects a duplicate combination', async () => {
    const { useCase } = buildUseCase(new Set(['size-s']));

    await expect(
      useCase.execute({
        productId: 'product-1',
        sku: 'JERSEY-S2',
        title: 'S',
        price: 10,
        optionValueIds: ['size-s'],
        actorUserId: 'staff-1',
        ipAddress: null,
      }),
    ).rejects.toBeInstanceOf(DuplicateVariantCombinationError);
  });

  it('rejects a duplicate SKU', async () => {
    const { useCase } = buildUseCase(new Set(), true);

    await expect(
      useCase.execute({
        productId: 'product-1',
        sku: 'JERSEY-S',
        title: 'S',
        price: 10,
        optionValueIds: ['size-s'],
        actorUserId: 'staff-1',
        ipAddress: null,
      }),
    ).rejects.toBeInstanceOf(VariantSkuAlreadyExistsError);
  });

  it('creates a variant when everything is valid', async () => {
    const { useCase, variants } = buildUseCase(new Set());

    await useCase.execute({
      productId: 'product-1',
      sku: 'jersey-s',
      title: 'S',
      price: 10,
      optionValueIds: ['size-s'],
      actorUserId: 'staff-1',
      ipAddress: null,
    });

    expect(variants.create).toHaveBeenCalledWith(
      expect.objectContaining({ sku: 'JERSEY-S', combinationKey: 'size-s' }),
    );
  });
});
