import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { CollectionNotFoundError } from '../../domain/errors/taxonomy.errors';
import type { CollectionRepositoryPort } from '../../domain/ports/collection.repository.port';
import { COLLECTION_REPOSITORY } from '../../taxonomy.constants';
import { TaxonomyCacheService } from '../services/taxonomy-cache.service';

export interface DeleteCollectionInput {
  id: string;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class DeleteCollectionUseCase {
  constructor(
    @Inject(COLLECTION_REPOSITORY) private readonly collections: CollectionRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
    private readonly cache: TaxonomyCacheService,
  ) {}

  async execute(input: DeleteCollectionInput): Promise<void> {
    if (!(await this.collections.findById(input.id))) {
      throw new CollectionNotFoundError();
    }

    await this.collections.delete(input.id);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'taxonomy.collection.deleted',
      ipAddress: input.ipAddress,
      metadata: { collectionId: input.id },
    });

    await this.cache.invalidateCollectionsList();
  }
}
