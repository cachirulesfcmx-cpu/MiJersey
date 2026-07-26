import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import {
  CategoryHasChildrenError,
  CategoryNotFoundError,
} from '../../domain/errors/taxonomy.errors';
import type { CategoryRepositoryPort } from '../../domain/ports/category.repository.port';
import { CATEGORY_REPOSITORY } from '../../taxonomy.constants';
import { TaxonomyCacheService } from '../services/taxonomy-cache.service';

export interface DeleteCategoryInput {
  id: string;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class DeleteCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY) private readonly categories: CategoryRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
    private readonly cache: TaxonomyCacheService,
  ) {}

  async execute(input: DeleteCategoryInput): Promise<void> {
    const category = await this.categories.findById(input.id);
    if (!category) {
      throw new CategoryNotFoundError();
    }

    if (await this.categories.hasChildren(input.id)) {
      throw new CategoryHasChildrenError();
    }

    await this.categories.delete(input.id);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'taxonomy.category.deleted',
      ipAddress: input.ipAddress,
      metadata: { categoryId: input.id },
    });

    await this.cache.invalidateCategoryTree();
  }
}
