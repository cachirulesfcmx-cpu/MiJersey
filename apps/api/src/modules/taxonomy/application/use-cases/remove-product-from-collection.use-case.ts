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
import { TaxonomyCacheService } from '../services/taxonomy-cache.service';

export interface RemoveProductFromCollectionInput {
  collectionId: string;
  productId: string;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class RemoveProductFromCollectionUseCase {
  constructor(
    @Inject(COLLECTION_REPOSITORY) private readonly collections: CollectionRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
    private readonly cache: TaxonomyCacheService,
  ) {}

  async execute(input: RemoveProductFromCollectionInput): Promise<void> {
    const collection = await this.collections.findById(input.collectionId);
    if (!collection) {
      throw new CollectionNotFoundError();
    }

    if (collection.type !== CollectionType.MANUAL) {
      throw new InvalidCollectionOperationError(
        'Solo las colecciones manuales permiten quitar productos a mano',
      );
    }

    await this.collections.removeProduct(input.collectionId, input.productId);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'taxonomy.collection.product_removed',
      ipAddress: input.ipAddress,
      metadata: { collectionId: input.collectionId, productId: input.productId },
    });

    await this.cache.invalidateCollectionsList();
  }
}
