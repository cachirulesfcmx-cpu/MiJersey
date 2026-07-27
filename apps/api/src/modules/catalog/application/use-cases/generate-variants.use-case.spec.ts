import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { ProductEntity, type ProductProps } from '../../domain/entities/product.entity';
import { ProductOptionEntity } from '../../domain/entities/product-option.entity';
import { ProductOptionValueEntity } from '../../domain/entities/product-option-value.entity';
import type { ProductRepositoryPort } from '../../domain/ports/product.repository.port';
import type { ProductOptionRepositoryPort } from '../../domain/ports/product-option.repository.port';
import type {
  CreateVariantData,
  ProductVariantRepositoryPort,
} from '../../domain/ports/product-variant.repository.port';
import {
  ProductStatus,
  ProductType,
  ProductVisibility,
} from '../../domain/value-objects/product-enums';
import { GenerateVariantsUseCase } from './generate-variants.use-case';

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

function buildOption(id: string, name: string, values: string[]): ProductOptionEntity {
  return new ProductOptionEntity({
    id,
    productId: 'product-1',
    name,
    position: 0,
    values: values.map(
      (value, index) =>
        new ProductOptionValueEntity({
          id: `${id}-${value}`,
          optionId: id,
          value,
          position: index,
        }),
    ),
  });
}

function buildUseCase(options: ProductOptionEntity[], existingKeys: Set<string>) {
  const products = {
    findById: jest.fn().mockResolvedValue(buildProduct()),
  } as unknown as jest.Mocked<ProductRepositoryPort>;
  const productOptions = {
    findByProductId: jest.fn().mockResolvedValue(options),
  } as unknown as jest.Mocked<ProductOptionRepositoryPort>;
  const variants: jest.Mocked<ProductVariantRepositoryPort> = {
    findById: jest.fn(),
    existsBySku: jest.fn().mockResolvedValue(false),
    existsBySlug: jest.fn().mockResolvedValue(false),
    create: jest.fn(),
    createMany: jest.fn((items: CreateVariantData[]) => Promise.resolve(items.length)),
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
    useCase: new GenerateVariantsUseCase(products, productOptions, variants, auditLog),
    variants,
  };
}

describe('GenerateVariantsUseCase', () => {
  it('generates the full cartesian product when nothing exists yet', async () => {
    const options = [
      buildOption('size', 'Talla', ['S', 'M']),
      buildOption('color', 'Color', ['Rojo', 'Azul']),
    ];
    const { useCase, variants } = buildUseCase(options, new Set());

    const result = await useCase.execute({
      productId: 'product-1',
      basePrice: 10,
      actorUserId: 'staff-1',
      ipAddress: null,
    });

    expect(result).toEqual({ created: 4, skippedExisting: 0 });
    expect(variants.createMany).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ price: 10 })]),
    );
    const createdSkus = (variants.createMany.mock.calls[0]?.[0] as CreateVariantData[]).map(
      (item) => item.sku,
    );
    expect(new Set(createdSkus).size).toBe(4);
  });

  it('skips combinations that already exist', async () => {
    const options = [buildOption('size', 'Talla', ['S', 'M'])];
    const existing = new Set(['size-S']);
    const { useCase, variants } = buildUseCase(options, existing);

    const result = await useCase.execute({
      productId: 'product-1',
      actorUserId: 'staff-1',
      ipAddress: null,
    });

    expect(result).toEqual({ created: 1, skippedExisting: 1 });
    expect(variants.createMany).toHaveBeenCalledWith([
      expect.objectContaining({ combinationKey: 'size-M' }),
    ]);
  });

  it('creates a single default variant for a product with no options', async () => {
    const { useCase, variants } = buildUseCase([], new Set());

    const result = await useCase.execute({
      productId: 'product-1',
      actorUserId: 'staff-1',
      ipAddress: null,
    });

    expect(result).toEqual({ created: 1, skippedExisting: 0 });
    expect(variants.createMany).toHaveBeenCalledWith([
      expect.objectContaining({ combinationKey: '', optionValueIds: [] }),
    ]);
  });

  it('does not call createMany again once every combination already exists', async () => {
    const options = [buildOption('size', 'Talla', ['S'])];
    const { useCase, variants } = buildUseCase(options, new Set(['size-S']));

    const result = await useCase.execute({
      productId: 'product-1',
      actorUserId: 'staff-1',
      ipAddress: null,
    });

    expect(result).toEqual({ created: 0, skippedExisting: 1 });
    expect(variants.createMany).not.toHaveBeenCalled();
  });
});
