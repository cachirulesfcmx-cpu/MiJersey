import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import {
  CollectionNotFoundError,
  InvalidCollectionOperationError,
} from '../../domain/errors/taxonomy.errors';
import type {
  CollectionRepositoryPort,
  CollectionRuleInput,
} from '../../domain/ports/collection.repository.port';
import { CollectionRuleMatchType, CollectionType } from '../../domain/value-objects/taxonomy-enums';
import { COLLECTION_REPOSITORY } from '../../taxonomy.constants';
import { TaxonomyCacheService } from '../services/taxonomy-cache.service';

export interface UpdateCollectionRulesInput {
  collectionId: string;
  matchType: CollectionRuleMatchType;
  rules: CollectionRuleInput[];
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class UpdateCollectionRulesUseCase {
  constructor(
    @Inject(COLLECTION_REPOSITORY) private readonly collections: CollectionRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
    private readonly cache: TaxonomyCacheService,
  ) {}

  async execute(input: UpdateCollectionRulesInput): Promise<void> {
    const collection = await this.collections.findById(input.collectionId);
    if (!collection) {
      throw new CollectionNotFoundError();
    }

    if (collection.type !== CollectionType.SMART) {
      throw new InvalidCollectionOperationError('Solo las colecciones inteligentes tienen reglas');
    }

    await this.collections.replaceRules(input.collectionId, input.matchType, input.rules);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'taxonomy.collection.rules_updated',
      ipAddress: input.ipAddress,
      metadata: { collectionId: input.collectionId, ruleCount: input.rules.length },
    });

    await this.cache.invalidateCollectionsList();
  }
}
