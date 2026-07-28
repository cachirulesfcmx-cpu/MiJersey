import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import type { SeoMetadataEntity } from '../../domain/entities/seo-metadata.entity';
import { SeoEntityNotFoundError } from '../../domain/errors/seo.errors';
import type { EntityLookupPort } from '../../domain/ports/entity-lookup.port';
import type {
  SeoMetadataRepositoryPort,
  UpsertSeoMetadataData,
} from '../../domain/ports/seo-metadata.repository.port';
import type { SeoEntityType } from '../../domain/value-objects/seo-enums';
import { ENTITY_LOOKUP, SEO_METADATA_REPOSITORY } from '../../seo.constants';

export interface UpsertSeoMetadataInput extends UpsertSeoMetadataData {
  entityType: SeoEntityType;
  entityId: string;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class UpsertSeoMetadataUseCase {
  constructor(
    @Inject(SEO_METADATA_REPOSITORY) private readonly seoMetadata: SeoMetadataRepositoryPort,
    @Inject(ENTITY_LOOKUP) private readonly entityLookup: EntityLookupPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: UpsertSeoMetadataInput): Promise<SeoMetadataEntity> {
    if (!(await this.entityLookup.exists(input.entityType, input.entityId))) {
      throw new SeoEntityNotFoundError();
    }

    const metadata = await this.seoMetadata.upsert(input.entityType, input.entityId, input);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'seo.metadata.updated',
      ipAddress: input.ipAddress,
      metadata: { entityType: input.entityType, entityId: input.entityId },
    });

    return metadata;
  }
}
