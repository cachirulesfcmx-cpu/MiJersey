import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { CategoryNotFoundError, ProductNotFoundError } from '../../domain/errors/taxonomy.errors';
import type { CategoryRepositoryPort } from '../../domain/ports/category.repository.port';
import type { ProductQueryPort } from '../../domain/ports/product-query.port';
import { CATEGORY_REPOSITORY, PRODUCT_QUERY } from '../../taxonomy.constants';

export interface AssignProductsToCategoryInput {
  categoryId: string;
  productIds: string[];
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class AssignProductsToCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY) private readonly categories: CategoryRepositoryPort,
    @Inject(PRODUCT_QUERY) private readonly products: ProductQueryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: AssignProductsToCategoryInput): Promise<void> {
    if (!(await this.categories.findById(input.categoryId))) {
      throw new CategoryNotFoundError();
    }

    const found = await this.products.findByIds(input.productIds);
    if (found.length !== input.productIds.length) {
      throw new ProductNotFoundError();
    }

    await this.categories.assignProducts(input.categoryId, input.productIds);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'taxonomy.category.products_assigned',
      ipAddress: input.ipAddress,
      metadata: { categoryId: input.categoryId, productIds: input.productIds },
    });
  }
}
