import { slugify } from '@mijersey/shared-utils';
import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import type { CollectionEntity } from '../../domain/entities/collection.entity';
import {
  CollectionSlugAlreadyExistsError,
  InvalidCollectionOperationError,
} from '../../domain/errors/taxonomy.errors';
import type {
  CollectionRepositoryPort,
  CollectionRuleInput,
} from '../../domain/ports/collection.repository.port';
import { Slug } from '../../domain/value-objects/slug.vo';
import { CollectionRuleMatchType, CollectionType } from '../../domain/value-objects/taxonomy-enums';
import { COLLECTION_REPOSITORY } from '../../taxonomy.constants';

export interface CreateCollectionInput {
  slug?: string;
  name: string;
  description?: string;
  type: CollectionType;
  matchType?: CollectionRuleMatchType;
  rules?: CollectionRuleInput[];
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class CreateCollectionUseCase {
  constructor(
    @Inject(COLLECTION_REPOSITORY) private readonly collections: CollectionRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: CreateCollectionInput): Promise<CollectionEntity> {
    if (input.type === CollectionType.MANUAL && input.rules?.length) {
      throw new InvalidCollectionOperationError('Las colecciones manuales no aceptan reglas');
    }

    const slug = Slug.create(input.slug?.trim() ? input.slug : slugify(input.name)).toString();

    if (await this.collections.existsBySlug(slug)) {
      throw new CollectionSlugAlreadyExistsError();
    }

    const collection = await this.collections.create({
      slug,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      type: input.type,
      matchType: input.matchType ?? CollectionRuleMatchType.ALL,
    });

    if (input.type === CollectionType.SMART && input.rules?.length) {
      await this.collections.replaceRules(
        collection.id,
        input.matchType ?? CollectionRuleMatchType.ALL,
        input.rules,
      );
    }

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'taxonomy.collection.created',
      ipAddress: input.ipAddress,
      metadata: { collectionId: collection.id },
    });

    return (await this.collections.findById(collection.id)) ?? collection;
  }
}
