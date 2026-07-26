import { slugify } from '@mijersey/shared-utils';
import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import type { CategoryEntity } from '../../domain/entities/category.entity';
import {
  CategoryMaxDepthExceededError,
  CategoryNotFoundError,
  CategorySlugAlreadyExistsError,
} from '../../domain/errors/taxonomy.errors';
import type { CategoryRepositoryPort } from '../../domain/ports/category.repository.port';
import { Slug } from '../../domain/value-objects/slug.vo';
import { CATEGORY_REPOSITORY, MAX_CATEGORY_DEPTH } from '../../taxonomy.constants';
import { TaxonomyCacheService } from '../services/taxonomy-cache.service';
import { computeDepth } from './category-tree.util';

export interface CreateCategoryInput {
  slug?: string;
  name: string;
  description?: string;
  image?: string;
  parentId?: string | null;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class CreateCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY) private readonly categories: CategoryRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
    private readonly cache: TaxonomyCacheService,
  ) {}

  async execute(input: CreateCategoryInput): Promise<CategoryEntity> {
    const slug = Slug.create(input.slug?.trim() ? input.slug : slugify(input.name)).toString();

    if (await this.categories.existsBySlug(slug)) {
      throw new CategorySlugAlreadyExistsError();
    }

    const parentId = input.parentId ?? null;

    if (parentId !== null) {
      const parent = await this.categories.findById(parentId);
      if (!parent) {
        throw new CategoryNotFoundError();
      }

      const parentDepth = await computeDepth(this.categories, parentId);
      if (parentDepth + 1 >= MAX_CATEGORY_DEPTH) {
        throw new CategoryMaxDepthExceededError();
      }
    }

    const category = await this.categories.create({
      slug,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      image: input.image?.trim() || null,
      parentId,
    });

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'taxonomy.category.created',
      ipAddress: input.ipAddress,
      metadata: { categoryId: category.id },
    });

    await this.cache.invalidateCategoryTree();

    return category;
  }
}
