import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { ProductEntity, type ProductProps } from '../../domain/entities/product.entity';
import { ProductNotFoundError } from '../../domain/errors/catalog.errors';
import type { ProductRepositoryPort } from '../../domain/ports/product.repository.port';
import {
  ProductStatus,
  ProductType,
  ProductVisibility,
} from '../../domain/value-objects/product-enums';
import { DuplicateProductUseCase } from './duplicate-product.use-case';

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

describe('DuplicateProductUseCase', () => {
  it('rejects duplicating a product that does not exist', async () => {
    const products = {
      findById: jest.fn().mockResolvedValue(null),
    } as unknown as jest.Mocked<ProductRepositoryPort>;
    const auditLog = { record: jest.fn() } as unknown as jest.Mocked<AuditLogRepositoryPort>;

    const useCase = new DuplicateProductUseCase(products, auditLog);

    await expect(
      useCase.execute({ id: 'missing', actorUserId: 'staff-1', ipAddress: null }),
    ).rejects.toBeInstanceOf(ProductNotFoundError);
  });

  it('appends -2, -3... until it finds a free SKU and slug', async () => {
    const source = buildProduct();
    const duplicate = buildProduct({
      id: 'product-2',
      sku: `${source.sku}-COPY-2`,
      slug: `${source.slug}-copy-2`,
      status: ProductStatus.DRAFT,
      visibility: ProductVisibility.HIDDEN,
    });

    const products: jest.Mocked<ProductRepositoryPort> = {
      findById: jest.fn().mockResolvedValue(source),
      findBySlug: jest.fn(),
      // El SKU/slug base "-COPY"/"-copy" ya está tomado; "-COPY-2"/"-copy-2" está libre.
      existsBySku: jest.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false),
      existsBySlug: jest.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false),
      create: jest.fn().mockResolvedValue(duplicate),
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

    const useCase = new DuplicateProductUseCase(products, auditLog);
    const result = await useCase.execute({
      id: source.id,
      actorUserId: 'staff-1',
      ipAddress: null,
    });

    expect(products.create).toHaveBeenCalledWith(
      expect.objectContaining({
        sku: `${source.sku}-COPY-2`,
        slug: `${source.slug}-copy-2`,
        visibility: ProductVisibility.HIDDEN,
      }),
    );
    expect(result.id).toBe(duplicate.id);
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'catalog.product.duplicated' }),
    );
  });
});
