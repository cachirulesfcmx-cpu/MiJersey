import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { HomeSectionEntity } from '../../domain/entities/home-section.entity';
import { HomeSectionNotFoundError } from '../../domain/errors/home.errors';
import type { HomeSectionRepositoryPort } from '../../domain/ports/home-section.repository.port';
import { HomeSectionStatus, HomeSectionType } from '../../domain/value-objects/home-section-enums';
import type { HomeMediaUsageService } from '../services/home-media-usage.service';
import { DeleteHomeSectionUseCase } from './delete-home-section.use-case';

function buildExisting(): HomeSectionEntity {
  return new HomeSectionEntity({
    id: 'section-1',
    type: HomeSectionType.PROMOTION_BANNER,
    title: 'Promo',
    configuration: { imageMediaId: 'media-1' },
    sortOrder: 0,
    status: HomeSectionStatus.PUBLISHED,
    isVisible: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildUseCase(existing: HomeSectionEntity | null) {
  const sections: jest.Mocked<HomeSectionRepositoryPort> = {
    findAll: jest.fn(),
    findPublished: jest.fn(),
    findById: jest.fn().mockResolvedValue(existing),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn().mockResolvedValue(undefined),
    reorder: jest.fn(),
    maxSortOrder: jest.fn(),
  };
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };
  const mediaUsage = {
    applyOnCreate: jest.fn().mockResolvedValue(undefined),
    applyOnUpdate: jest.fn().mockResolvedValue(undefined),
    releaseAll: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<HomeMediaUsageService>;

  return {
    useCase: new DeleteHomeSectionUseCase(sections, auditLog, mediaUsage),
    sections,
    mediaUsage,
  };
}

describe('DeleteHomeSectionUseCase', () => {
  it('throws when the section does not exist', async () => {
    const { useCase } = buildUseCase(null);

    await expect(
      useCase.execute({ id: 'missing', actorUserId: 'staff-1', ipAddress: null }),
    ).rejects.toBeInstanceOf(HomeSectionNotFoundError);
  });

  it('releases media usage before deleting', async () => {
    const existing = buildExisting();
    const { useCase, sections, mediaUsage } = buildUseCase(existing);

    await useCase.execute({ id: 'section-1', actorUserId: 'staff-1', ipAddress: null });

    expect(mediaUsage.releaseAll).toHaveBeenCalledWith(
      'section-1',
      HomeSectionType.PROMOTION_BANNER,
      { imageMediaId: 'media-1' },
    );
    expect(sections.delete).toHaveBeenCalledWith('section-1');
  });
});
