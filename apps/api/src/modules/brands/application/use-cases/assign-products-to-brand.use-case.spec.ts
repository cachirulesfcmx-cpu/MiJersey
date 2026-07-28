import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { BrandEntity, type BrandProps } from '../../domain/entities/brand.entity';
import { BrandNotFoundError, ProductNotFoundError } from '../../domain/errors/brand.errors';
import type { BrandRepositoryPort } from '../../domain/ports/brand.repository.port';
import type { BrandProductSummary, ProductQueryPort } from '../../domain/ports/product-query.port';
import { BrandStatus } from '../../domain/value-objects/brand-status';
import { AssignProductsToBrandUseCase } from './assign-products-to-brand.use-case';

function buildBrand(overrides: Partial<BrandProps> = {}): BrandEntity {
  return new BrandEntity({
    id: 'brand-1',
    slug: 'nike',
    name: 'Nike',
    description: null,
    shortDescription: null,
    logoMediaId: null,
    coverMediaId: null,
    website: null,
    country: null,
    status: BrandStatus.ACTIVE,
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

function buildProductSummary(id: string): BrandProductSummary {
  return {
    id,
    sku: `sku-${id}`,
    slug: `slug-${id}`,
    name: `Product ${id}`,
    status: 'ACTIVE',
    visibility: 'PUBLIC',
    createdAt: new Date(),
  };
}

function buildUseCase(brand: BrandEntity | null, foundProductIds: string[]) {
  const brands: jest.Mocked<BrandRepositoryPort> = {
    findById: jest.fn().mockResolvedValue(brand),
    findBySlug: jest.fn(),
    existsBySlug: jest.fn(),
    existsByName: jest.fn(),
    findMany: jest.fn(),
    findPublicBySlug: jest.fn(),
    findAllActive: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    reorder: jest.fn(),
    delete: jest.fn(),
  };
  const products: jest.Mocked<ProductQueryPort> = {
    exists: jest.fn(),
    findByIds: jest.fn().mockResolvedValue(foundProductIds.map(buildProductSummary)),
    countByBrand: jest.fn(),
    findByBrand: jest.fn(),
    assignToBrand: jest.fn().mockResolvedValue(undefined),
    unassignFromBrand: jest.fn(),
    unassignAllFromBrand: jest.fn(),
  };
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  return { useCase: new AssignProductsToBrandUseCase(brands, products, auditLog), products };
}

describe('AssignProductsToBrandUseCase', () => {
  it('throws when the brand does not exist', async () => {
    const { useCase } = buildUseCase(null, ['p1']);

    await expect(
      useCase.execute({
        brandId: 'missing',
        productIds: ['p1'],
        actorUserId: 'staff-1',
        ipAddress: null,
      }),
    ).rejects.toBeInstanceOf(BrandNotFoundError);
  });

  it('throws when one of the products does not exist', async () => {
    const brand = buildBrand();
    const { useCase } = buildUseCase(brand, ['p1']);

    await expect(
      useCase.execute({
        brandId: brand.id,
        productIds: ['p1', 'p2'],
        actorUserId: 'staff-1',
        ipAddress: null,
      }),
    ).rejects.toBeInstanceOf(ProductNotFoundError);
  });

  it('assigns every product to the brand, replacing any previous brand', async () => {
    const brand = buildBrand();
    const { useCase, products } = buildUseCase(brand, ['p1', 'p2']);

    await useCase.execute({
      brandId: brand.id,
      productIds: ['p1', 'p2'],
      actorUserId: 'staff-1',
      ipAddress: null,
    });

    expect(products.assignToBrand).toHaveBeenCalledWith(['p1', 'p2'], brand.id);
  });
});
