import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { CategoryNotFoundError } from '../../domain/errors/taxonomy.errors';
import type { CategoryRepositoryPort } from '../../domain/ports/category.repository.port';
import { CATEGORY_REPOSITORY } from '../../taxonomy.constants';
import { TaxonomyCacheService } from '../services/taxonomy-cache.service';

export interface ReorderCategoriesInput {
  parentId: string | null;
  orderedIds: string[];
  actorUserId: string;
  ipAddress: string | null;
}

/** Fija el `sortOrder` de un grupo de hermanas según el orden recibido (arrastrar y soltar). */
@Injectable()
export class ReorderCategoriesUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY) private readonly categories: CategoryRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
    private readonly cache: TaxonomyCacheService,
  ) {}

  async execute(input: ReorderCategoriesInput): Promise<void> {
    const siblings = await Promise.all(input.orderedIds.map((id) => this.categories.findById(id)));
    const allSiblings = siblings.every(
      (category) => category && category.parentId === input.parentId,
    );
    if (!allSiblings) {
      throw new CategoryNotFoundError();
    }

    await this.categories.reorder(input.parentId, input.orderedIds);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'taxonomy.category.reordered',
      ipAddress: input.ipAddress,
      metadata: { parentId: input.parentId, orderedIds: input.orderedIds },
    });

    await this.cache.invalidateCategoryTree();
  }
}
