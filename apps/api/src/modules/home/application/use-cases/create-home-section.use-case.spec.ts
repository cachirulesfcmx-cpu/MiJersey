import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { HomeSectionEntity } from '../../domain/entities/home-section.entity';
import { InvalidHomeSectionConfigError } from '../../domain/errors/home.errors';
import type { HomeSectionRepositoryPort } from '../../domain/ports/home-section.repository.port';
import { HomeSectionStatus, HomeSectionType } from '../../domain/value-objects/home-section-enums';
import type { HomeMediaUsageService } from '../services/home-media-usage.service';
import { CreateHomeSectionUseCase } from './create-home-section.use-case';

function buildUseCase(maxSortOrder = -1) {
  const sections: jest.Mocked<HomeSectionRepositoryPort> = {
    findAll: jest.fn(),
    findPublished: jest.fn(),
    findById: jest.fn(),
    create: jest.fn((data) =>
      Promise.resolve(
        new HomeSectionEntity({
          id: 'section-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        }),
      ),
    ),
    update: jest.fn(),
    delete: jest.fn(),
    reorder: jest.fn(),
    maxSortOrder: jest.fn().mockResolvedValue(maxSortOrder),
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
    useCase: new CreateHomeSectionUseCase(sections, auditLog, mediaUsage),
    sections,
    mediaUsage,
  };
}

describe('CreateHomeSectionUseCase', () => {
  it('rejects a configuration missing required fields for the given type', async () => {
    const { useCase } = buildUseCase();

    await expect(
      useCase.execute({
        type: HomeSectionType.HERO_BANNER,
        title: 'Hero',
        configuration: {},
        actorUserId: 'staff-1',
        ipAddress: null,
      }),
    ).rejects.toBeInstanceOf(InvalidHomeSectionConfigError);
  });

  it('appends the new section after the current maximum sortOrder', async () => {
    const { useCase, sections } = buildUseCase(4);

    await useCase.execute({
      type: HomeSectionType.RICH_TEXT,
      title: 'Texto',
      configuration: { html: '<p>hi</p>' },
      actorUserId: 'staff-1',
      ipAddress: null,
    });

    expect(sections.create).toHaveBeenCalledWith(
      expect.objectContaining({ sortOrder: 5, status: HomeSectionStatus.DRAFT, isVisible: true }),
    );
  });

  it('registers media usage for any MediaAsset referenced by the configuration', async () => {
    const { useCase, mediaUsage } = buildUseCase();

    await useCase.execute({
      type: HomeSectionType.HERO_BANNER,
      title: 'Hero',
      configuration: { imageMediaId: 'media-1', headline: 'Hola' },
      actorUserId: 'staff-1',
      ipAddress: null,
    });

    expect(mediaUsage.applyOnCreate).toHaveBeenCalledWith(
      'section-1',
      HomeSectionType.HERO_BANNER,
      { imageMediaId: 'media-1', headline: 'Hola' },
    );
  });
});
