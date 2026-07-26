import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { ProductEntity, type ProductProps } from '../../domain/entities/product.entity';
import { SkuAlreadyExistsError, SlugAlreadyExistsError } from '../../domain/errors/catalog.errors';
import type { ProductRepositoryPort } from '../../domain/ports/product.repository.port';
import {
  ProductStatus,
  ProductType,
  ProductVisibility,
} from '../../domain/value-objects/product-enums';
import { CreateProductUseCase } from './create-product.use-case';

function buildProduct(overrides: Partial<ProductProps> = {}): ProductEntity {
  return new ProductEntity({
    id: 'product-1',
    sku: 'JERSEY-HOME-26',
    slug: 'jersey-local-2026',
    name: 'Jersey Local 2026',
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

function buildUseCase(existsBySku: boolean, existsBySlug: boolean) {
  const products: jest.Mocked<ProductRepositoryPort> = {
    findById: jest.fn(),
    findBySlug: jest.fn(),
    existsBySku: jest.fn().mockResolvedValue(existsBySku),
    existsBySlug: jest.fn().mockResolvedValue(existsBySlug),
    create: jest.fn().mockResolvedValue(buildProduct()),
    update: jest.fn(),
    updateStatus: jest.fn(),
    bulkUpdateStatus: jest.fn(),
    softDelete: jest.fn(),
    bulkSoftDelete: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  };
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  const useCase = new CreateProductUseCase(products, auditLog);
  return { useCase, products, auditLog };
}

describe('CreateProductUseCase', () => {
  it('creates a product and derives the slug from the name when none is given', async () => {
    const { useCase, products, auditLog } = buildUseCase(false, false);

    await useCase.execute({
      sku: 'jersey-home-26',
      name: 'Jersey Local 2026',
      actorUserId: 'staff-1',
      ipAddress: '127.0.0.1',
    });

    expect(products.create).toHaveBeenCalledWith(
      expect.objectContaining({ sku: 'JERSEY-HOME-26', slug: 'jersey-local-2026' }),
    );
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'catalog.product.created' }),
    );
  });

  it('rejects a duplicate SKU', async () => {
    const { useCase } = buildUseCase(true, false);

    await expect(
      useCase.execute({
        sku: 'JERSEY-HOME-26',
        name: 'Jersey',
        actorUserId: 'staff-1',
        ipAddress: null,
      }),
    ).rejects.toBeInstanceOf(SkuAlreadyExistsError);
  });

  it('rejects a duplicate slug', async () => {
    const { useCase } = buildUseCase(false, true);

    await expect(
      useCase.execute({
        sku: 'JERSEY-HOME-26',
        slug: 'jersey-local-2026',
        name: 'Jersey',
        actorUserId: 'staff-1',
        ipAddress: null,
      }),
    ).rejects.toBeInstanceOf(SlugAlreadyExistsError);
  });
});
