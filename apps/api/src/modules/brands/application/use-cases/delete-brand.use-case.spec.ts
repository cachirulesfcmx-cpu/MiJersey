import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import type { MediaUsageService } from '../../../media/application/services/media-usage.service';
import { BrandEntity, type BrandProps } from '../../domain/entities/brand.entity';
import { BrandHasProductsError, BrandNotFoundError } from '../../domain/errors/brand.errors';
import type { BrandRepositoryPort } from '../../domain/ports/brand.repository.port';
import type { ProductQueryPort } from '../../domain/ports/product-query.port';
import { BrandStatus } from '../../domain/value-objects/brand-status';
import { DeleteBrandUseCase } from './delete-brand.use-case';

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

function buildUseCase(brand: BrandEntity | null, productCount: number) {
  const repo: jest.Mocked<BrandRepositoryPort> = {
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
    findByIds: jest.fn(),
    countByBrand: jest.fn().mockResolvedValue(productCount),
    findByBrand: jest.fn(),
    assignToBrand: jest.fn(),
    unassignFromBrand: jest.fn(),
    unassignAllFromBrand: jest.fn().mockResolvedValue(undefined),
  };
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };
  const mediaUsage = {
    recordUsage: jest.fn(),
    removeUsage: jest.fn().mockResolvedValue(undefined),
    countByAsset: jest.fn(),
    findByAsset: jest.fn(),
  } as unknown as jest.Mocked<MediaUsageService>;

  return { useCase: new DeleteBrandUseCase(repo, products, auditLog, mediaUsage), repo, products };
}

describe('DeleteBrandUseCase', () => {
  it('throws when the brand does not exist', async () => {
    const { useCase } = buildUseCase(null, 0);

    await expect(
      useCase.execute({ id: 'missing', actorUserId: 'staff-1', ipAddress: null }),
    ).rejects.toBeInstanceOf(BrandNotFoundError);
  });

  it('refuses to delete a brand with products unless forced', async () => {
    const brand = buildBrand();
    const { useCase, repo, products } = buildUseCase(brand, 3);

    await expect(
      useCase.execute({ id: brand.id, actorUserId: 'staff-1', ipAddress: null }),
    ).rejects.toBeInstanceOf(BrandHasProductsError);

    expect(products.unassignAllFromBrand).not.toHaveBeenCalled();
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it('unassigns every product and deletes the brand when forced', async () => {
    const brand = buildBrand();
    const { useCase, repo, products } = buildUseCase(brand, 3);

    await useCase.execute({ id: brand.id, force: true, actorUserId: 'staff-1', ipAddress: null });

    expect(products.unassignAllFromBrand).toHaveBeenCalledWith(brand.id);
    expect(repo.delete).toHaveBeenCalledWith(brand.id);
  });

  it('deletes a brand without products without needing force', async () => {
    const brand = buildBrand();
    const { useCase, repo, products } = buildUseCase(brand, 0);

    await useCase.execute({ id: brand.id, actorUserId: 'staff-1', ipAddress: null });

    expect(products.unassignAllFromBrand).not.toHaveBeenCalled();
    expect(repo.delete).toHaveBeenCalledWith(brand.id);
  });
});
