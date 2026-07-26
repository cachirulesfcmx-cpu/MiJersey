import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import type { CategoryEntity } from '../../domain/entities/category.entity';
import {
  CategoryCycleError,
  CategoryMaxDepthExceededError,
  CategoryNotFoundError,
} from '../../domain/errors/taxonomy.errors';
import type { CategoryRepositoryPort } from '../../domain/ports/category.repository.port';
import { CATEGORY_REPOSITORY, MAX_CATEGORY_DEPTH } from '../../taxonomy.constants';
import { TaxonomyCacheService } from '../services/taxonomy-cache.service';
import { computeDepth, wouldCreateCycle } from './category-tree.util';

export interface MoveCategoryInput {
  id: string;
  parentId: string | null;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class MoveCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY) private readonly categories: CategoryRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
    private readonly cache: TaxonomyCacheService,
  ) {}

  async execute(input: MoveCategoryInput): Promise<CategoryEntity> {
    const category = await this.categories.findById(input.id);
    if (!category) {
      throw new CategoryNotFoundError();
    }

    if (input.parentId !== null) {
      if (input.parentId === input.id) {
        throw new CategoryCycleError();
      }

      const parent = await this.categories.findById(input.parentId);
      if (!parent) {
        throw new CategoryNotFoundError();
      }

      if (await wouldCreateCycle(this.categories, input.id, input.parentId)) {
        throw new CategoryCycleError();
      }

      const parentDepth = await computeDepth(this.categories, input.parentId);
      if (parentDepth + 1 >= MAX_CATEGORY_DEPTH) {
        throw new CategoryMaxDepthExceededError();
      }
    }

    const moved = await this.categories.move(input.id, input.parentId);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'taxonomy.category.moved',
      ipAddress: input.ipAddress,
      metadata: { categoryId: moved.id, parentId: input.parentId },
    });

    await this.cache.invalidateCategoryTree();

    return moved;
  }
}
