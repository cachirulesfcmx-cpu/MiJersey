import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import {
  CollectionNotFoundError,
  InvalidCollectionOperationError,
} from '../../domain/errors/taxonomy.errors';
import type { CollectionRepositoryPort } from '../../domain/ports/collection.repository.port';
import { CollectionType } from '../../domain/value-objects/taxonomy-enums';
import { COLLECTION_REPOSITORY } from '../../taxonomy.constants';

export interface ReorderCollectionProductsInput {
  collectionId: string;
  orderedProductIds: string[];
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class ReorderCollectionProductsUseCase {
  constructor(
    @Inject(COLLECTION_REPOSITORY) private readonly collections: CollectionRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: ReorderCollectionProductsInput): Promise<void> {
    const collection = await this.collections.findById(input.collectionId);
    if (!collection) {
      throw new CollectionNotFoundError();
    }

    if (collection.type !== CollectionType.MANUAL) {
      throw new InvalidCollectionOperationError(
        'Solo las colecciones manuales se pueden reordenar',
      );
    }

    await this.collections.reorderProducts(input.collectionId, input.orderedProductIds);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'taxonomy.collection.products_reordered',
      ipAddress: input.ipAddress,
      metadata: { collectionId: input.collectionId },
    });
  }
}
