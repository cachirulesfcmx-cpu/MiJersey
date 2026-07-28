import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { SeoRedirectService } from '../../../seo/application/services/seo-redirect.service';
import { SeoEntityType } from '../../../seo/domain/value-objects/seo-enums';
import type { CategoryEntity } from '../../domain/entities/category.entity';
import {
  CategoryNotFoundError,
  CategorySlugAlreadyExistsError,
} from '../../domain/errors/taxonomy.errors';
import type { CategoryRepositoryPort } from '../../domain/ports/category.repository.port';
import { Slug } from '../../domain/value-objects/slug.vo';
import type { CategoryStatus } from '../../domain/value-objects/taxonomy-enums';
import { CATEGORY_REPOSITORY } from '../../taxonomy.constants';
import { TaxonomyCacheService } from '../services/taxonomy-cache.service';

export interface UpdateCategoryInput {
  id: string;
  slug?: string;
  name?: string;
  description?: string | null;
  image?: string | null;
  status?: CategoryStatus;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class UpdateCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY) private readonly categories: CategoryRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
    private readonly cache: TaxonomyCacheService,
    private readonly seoRedirect: SeoRedirectService,
  ) {}

  async execute(input: UpdateCategoryInput): Promise<CategoryEntity> {
    const existing = await this.categories.findById(input.id);
    if (!existing) {
      throw new CategoryNotFoundError();
    }

    let slug: string | undefined;
    if (input.slug) {
      slug = Slug.create(input.slug).toString();
      const owner = await this.categories.findBySlug(slug);
      if (owner && owner.id !== input.id) {
        throw new CategorySlugAlreadyExistsError();
      }
    }

    const updated = await this.categories.update(input.id, {
      ...(slug !== undefined ? { slug } : {}),
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.description !== undefined
        ? { description: input.description?.trim() || null }
        : {}),
      ...(input.image !== undefined ? { image: input.image?.trim() || null } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    });

    if (slug !== undefined && slug !== existing.slug) {
      await this.seoRedirect.recordSlugChange(SeoEntityType.CATEGORY, existing.slug, slug);
    }

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'taxonomy.category.updated',
      ipAddress: input.ipAddress,
      metadata: { categoryId: updated.id },
    });

    await this.cache.invalidateCategoryTree();

    return updated;
  }
}
