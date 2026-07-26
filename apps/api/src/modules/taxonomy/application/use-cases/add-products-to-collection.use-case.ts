import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import {
  CollectionNotFoundError,
  InvalidCollectionOperationError,
  ProductNotFoundError,
} from '../../domain/errors/taxonomy.errors';
import type { CollectionRepositoryPort } from '../../domain/ports/collection.repository.port';
import type { ProductQueryPort } from '../../domain/ports/product-query.port';
import { CollectionType } from '../../domain/value-objects/taxonomy-enums';
import { COLLECTION_REPOSITORY, PRODUCT_QUERY } from '../../taxonomy.constants';
import { TaxonomyCacheService } from '../services/taxonomy-cache.service';

export interface AddProductsToCollectionInput {
  collectionId: string;
  productIds: string[];
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class AddProductsToCollectionUseCase {
  constructor(
    @Inject(COLLECTION_REPOSITORY) private readonly collections: CollectionRepositoryPort,
    @Inject(PRODUCT_QUERY) private readonly products: ProductQueryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
    private readonly cache: TaxonomyCacheService,
  ) {}

  async execute(input: AddProductsToCollectionInput): Promise<void> {
    const collection = await this.collections.findById(input.collectionId);
    if (!collection) {
      throw new CollectionNotFoundError();
    }

    if (collection.type !== CollectionType.MANUAL) {
      throw new InvalidCollectionOperationError(
        'Solo las colecciones manuales aceptan productos agregados a mano',
      );
    }

    const found = await this.products.findByIds(input.productIds);
    if (found.length !== input.productIds.length) {
      throw new ProductNotFoundError();
    }

    await this.collections.addProducts(input.collectionId, input.productIds);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'taxonomy.collection.products_added',
      ipAddress: input.ipAddress,
      metadata: { collectionId: input.collectionId, productIds: input.productIds },
    });

    await this.cache.invalidateCollectionsList();
  }
}
