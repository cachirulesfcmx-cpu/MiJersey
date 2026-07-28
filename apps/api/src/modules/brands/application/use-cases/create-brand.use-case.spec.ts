import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import type { MediaUsageService } from '../../../media/application/services/media-usage.service';
import { BrandEntity, type BrandProps } from '../../domain/entities/brand.entity';
import {
  BrandNameAlreadyExistsError,
  BrandSlugAlreadyExistsError,
} from '../../domain/errors/brand.errors';
import type { BrandRepositoryPort } from '../../domain/ports/brand.repository.port';
import { BrandStatus } from '../../domain/value-objects/brand-status';
import { CreateBrandUseCase } from './create-brand.use-case';

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

function buildUseCase(existsBySlug: boolean, existsByName: boolean) {
  const repo: jest.Mocked<BrandRepositoryPort> = {
    findById: jest.fn(),
    findBySlug: jest.fn(),
    existsBySlug: jest.fn().mockResolvedValue(existsBySlug),
    existsByName: jest.fn().mockResolvedValue(existsByName),
    findMany: jest.fn(),
    findPublicBySlug: jest.fn(),
    findAllActive: jest.fn(),
    create: jest.fn((data) => Promise.resolve(buildBrand({ id: 'new-brand', ...data }))),
    update: jest.fn(),
    reorder: jest.fn(),
    delete: jest.fn(),
  };
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };
  const mediaUsage = {
    recordUsage: jest.fn().mockResolvedValue(undefined),
    removeUsage: jest.fn().mockResolvedValue(undefined),
    countByAsset: jest.fn(),
    findByAsset: jest.fn(),
  } as unknown as jest.Mocked<MediaUsageService>;

  return { useCase: new CreateBrandUseCase(repo, auditLog, mediaUsage), repo, mediaUsage };
}

describe('CreateBrandUseCase', () => {
  it('rejects a duplicate slug', async () => {
    const { useCase } = buildUseCase(true, false);

    await expect(
      useCase.execute({ name: 'Nike', actorUserId: 'staff-1', ipAddress: null }),
    ).rejects.toBeInstanceOf(BrandSlugAlreadyExistsError);
  });

  it('rejects a duplicate name', async () => {
    const { useCase } = buildUseCase(false, true);

    await expect(
      useCase.execute({ name: 'Nike', actorUserId: 'staff-1', ipAddress: null }),
    ).rejects.toBeInstanceOf(BrandNameAlreadyExistsError);
  });

  it('derives the slug from the name when none is given', async () => {
    const { useCase, repo } = buildUseCase(false, false);

    await useCase.execute({ name: 'New Balance', actorUserId: 'staff-1', ipAddress: null });

    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ slug: 'new-balance' }));
  });

  it('registers media usage for the logo and cover when provided', async () => {
    const { useCase, mediaUsage } = buildUseCase(false, false);

    const brand = await useCase.execute({
      name: 'Adidas',
      logoMediaId: 'media-logo',
      coverMediaId: 'media-cover',
      actorUserId: 'staff-1',
      ipAddress: null,
    });

    expect(mediaUsage.recordUsage).toHaveBeenCalledWith('media-logo', 'brand.logo', brand.id);
    expect(mediaUsage.recordUsage).toHaveBeenCalledWith('media-cover', 'brand.cover', brand.id);
  });
});
