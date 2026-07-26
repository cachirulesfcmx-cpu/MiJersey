import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { CategoryNotFoundError } from '../../domain/errors/taxonomy.errors';
import type { CategoryRepositoryPort } from '../../domain/ports/category.repository.port';
import { CATEGORY_REPOSITORY } from '../../taxonomy.constants';

export interface RemoveProductFromCategoryInput {
  categoryId: string;
  productId: string;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class RemoveProductFromCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY) private readonly categories: CategoryRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: RemoveProductFromCategoryInput): Promise<void> {
    if (!(await this.categories.findById(input.categoryId))) {
      throw new CategoryNotFoundError();
    }

    await this.categories.removeProduct(input.categoryId, input.productId);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'taxonomy.category.product_removed',
      ipAddress: input.ipAddress,
      metadata: { categoryId: input.categoryId, productId: input.productId },
    });
  }
}
