import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { SeoMetadataEntity } from '../../domain/entities/seo-metadata.entity';
import { SeoEntityNotFoundError } from '../../domain/errors/seo.errors';
import type { EntityLookupPort } from '../../domain/ports/entity-lookup.port';
import type { SeoMetadataRepositoryPort } from '../../domain/ports/seo-metadata.repository.port';
import {
  SeoEntityType,
  SeoRobotsDirective,
  SeoTwitterCardType,
} from '../../domain/value-objects/seo-enums';
import { UpsertSeoMetadataUseCase } from './upsert-seo-metadata.use-case';

function buildMetadata(): SeoMetadataEntity {
  return new SeoMetadataEntity({
    id: 'seo-1',
    entityType: SeoEntityType.PRODUCT,
    entityId: 'product-1',
    metaTitle: 'Título',
    metaDescription: null,
    metaKeywords: null,
    canonicalUrl: null,
    robots: SeoRobotsDirective.INDEX_FOLLOW,
    ogTitle: null,
    ogDescription: null,
    ogImageMediaId: null,
    twitterCard: SeoTwitterCardType.SUMMARY_LARGE_IMAGE,
    structuredData: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildUseCase(entityExists: boolean) {
  const seoMetadata: jest.Mocked<SeoMetadataRepositoryPort> = {
    findByEntity: jest.fn(),
    upsert: jest.fn().mockResolvedValue(buildMetadata()),
  };
  const entityLookup: jest.Mocked<EntityLookupPort> = {
    exists: jest.fn().mockResolvedValue(entityExists),
  };
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  return {
    useCase: new UpsertSeoMetadataUseCase(seoMetadata, entityLookup, auditLog),
    seoMetadata,
  };
}

describe('UpsertSeoMetadataUseCase', () => {
  it('rejects when the referenced entity does not exist', async () => {
    const { useCase } = buildUseCase(false);

    await expect(
      useCase.execute({
        entityType: SeoEntityType.PRODUCT,
        entityId: 'missing',
        metaTitle: 'x',
        actorUserId: 'staff-1',
        ipAddress: null,
      }),
    ).rejects.toBeInstanceOf(SeoEntityNotFoundError);
  });

  it('upserts metadata for an existing entity', async () => {
    const { useCase, seoMetadata } = buildUseCase(true);

    await useCase.execute({
      entityType: SeoEntityType.PRODUCT,
      entityId: 'product-1',
      metaTitle: 'Título nuevo',
      actorUserId: 'staff-1',
      ipAddress: null,
    });

    expect(seoMetadata.upsert).toHaveBeenCalledWith(
      SeoEntityType.PRODUCT,
      'product-1',
      expect.objectContaining({ metaTitle: 'Título nuevo' }),
    );
  });
});
