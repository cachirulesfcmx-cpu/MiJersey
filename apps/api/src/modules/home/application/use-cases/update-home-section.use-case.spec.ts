import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { HomeSectionEntity } from '../../domain/entities/home-section.entity';
import {
  HomeSectionNotFoundError,
  InvalidHomeSectionConfigError,
} from '../../domain/errors/home.errors';
import type { HomeSectionRepositoryPort } from '../../domain/ports/home-section.repository.port';
import { HomeSectionStatus, HomeSectionType } from '../../domain/value-objects/home-section-enums';
import type { HomeMediaUsageService } from '../services/home-media-usage.service';
import { UpdateHomeSectionUseCase } from './update-home-section.use-case';

function buildExisting(): HomeSectionEntity {
  return new HomeSectionEntity({
    id: 'section-1',
    type: HomeSectionType.HERO_BANNER,
    title: 'Hero',
    configuration: { imageMediaId: 'media-1', headline: 'Hola' },
    sortOrder: 0,
    status: HomeSectionStatus.DRAFT,
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
    update: jest.fn((id, data) =>
      Promise.resolve(
        new HomeSectionEntity({ ...(existing as HomeSectionEntity).toJSON(), ...data }),
      ),
    ),
    delete: jest.fn(),
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
    useCase: new UpdateHomeSectionUseCase(sections, auditLog, mediaUsage),
    sections,
    mediaUsage,
  };
}

describe('UpdateHomeSectionUseCase', () => {
  it('throws when the section does not exist', async () => {
    const { useCase } = buildUseCase(null);

    await expect(
      useCase.execute({ id: 'missing', actorUserId: 'staff-1', ipAddress: null }),
    ).rejects.toBeInstanceOf(HomeSectionNotFoundError);
  });

  it('validates the new configuration against the existing type', async () => {
    const { useCase } = buildUseCase(buildExisting());

    await expect(
      useCase.execute({
        id: 'section-1',
        configuration: {},
        actorUserId: 'staff-1',
        ipAddress: null,
      }),
    ).rejects.toBeInstanceOf(InvalidHomeSectionConfigError);
  });

  it('diffs media usage when the configuration changes', async () => {
    const { useCase, mediaUsage } = buildUseCase(buildExisting());

    await useCase.execute({
      id: 'section-1',
      configuration: { imageMediaId: 'media-2', headline: 'Hola' },
      actorUserId: 'staff-1',
      ipAddress: null,
    });

    expect(mediaUsage.applyOnUpdate).toHaveBeenCalledWith(
      'section-1',
      HomeSectionType.HERO_BANNER,
      { imageMediaId: 'media-1', headline: 'Hola' },
      { imageMediaId: 'media-2', headline: 'Hola' },
    );
  });

  it('does not touch media usage when only the status changes', async () => {
    const { useCase, mediaUsage } = buildUseCase(buildExisting());

    await useCase.execute({
      id: 'section-1',
      status: HomeSectionStatus.PUBLISHED,
      actorUserId: 'staff-1',
      ipAddress: null,
    });

    expect(mediaUsage.applyOnUpdate).not.toHaveBeenCalled();
  });
});
