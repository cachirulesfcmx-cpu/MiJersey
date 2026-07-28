import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { SeoRedirectService } from '../../../seo/application/services/seo-redirect.service';
import { SeoEntityType } from '../../../seo/domain/value-objects/seo-enums';
import type { CollectionEntity } from '../../domain/entities/collection.entity';
import {
  CollectionNotFoundError,
  CollectionSlugAlreadyExistsError,
} from '../../domain/errors/taxonomy.errors';
import type { CollectionRepositoryPort } from '../../domain/ports/collection.repository.port';
import { Slug } from '../../domain/value-objects/slug.vo';
import type { CollectionStatus } from '../../domain/value-objects/taxonomy-enums';
import { COLLECTION_REPOSITORY } from '../../taxonomy.constants';
import { TaxonomyCacheService } from '../services/taxonomy-cache.service';

export interface UpdateCollectionInput {
  id: string;
  slug?: string;
  name?: string;
  description?: string | null;
  status?: CollectionStatus;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class UpdateCollectionUseCase {
  constructor(
    @Inject(COLLECTION_REPOSITORY) private readonly collections: CollectionRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
    private readonly cache: TaxonomyCacheService,
    private readonly seoRedirect: SeoRedirectService,
  ) {}

  async execute(input: UpdateCollectionInput): Promise<CollectionEntity> {
    const existing = await this.collections.findById(input.id);
    if (!existing) {
      throw new CollectionNotFoundError();
    }

    let slug: string | undefined;
    if (input.slug) {
      slug = Slug.create(input.slug).toString();
      const owner = await this.collections.findBySlug(slug);
      if (owner && owner.id !== input.id) {
        throw new CollectionSlugAlreadyExistsError();
      }
    }

    const updated = await this.collections.update(input.id, {
      ...(slug !== undefined ? { slug } : {}),
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.description !== undefined
        ? { description: input.description?.trim() || null }
        : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    });

    if (slug !== undefined && slug !== existing.slug) {
      await this.seoRedirect.recordSlugChange(SeoEntityType.COLLECTION, existing.slug, slug);
    }

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'taxonomy.collection.updated',
      ipAddress: input.ipAddress,
      metadata: { collectionId: updated.id },
    });

    await this.cache.invalidateCollectionsList();

    return updated;
  }
}
