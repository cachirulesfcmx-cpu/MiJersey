import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { PRODUCT_REPOSITORY } from '../../catalog.constants';
import type { ProductRepositoryPort } from '../../domain/ports/product.repository.port';

export interface BulkDeleteProductsInput {
  ids: string[];
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class BulkDeleteProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: BulkDeleteProductsInput): Promise<void> {
    await this.products.bulkSoftDelete(input.ids);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'catalog.product.bulk_deleted',
      ipAddress: input.ipAddress,
      metadata: { productIds: input.ids },
    });
  }
}
