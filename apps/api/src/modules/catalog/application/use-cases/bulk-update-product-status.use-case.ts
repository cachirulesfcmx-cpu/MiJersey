import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { PRODUCT_REPOSITORY } from '../../catalog.constants';
import type { ProductRepositoryPort } from '../../domain/ports/product.repository.port';
import type { ProductStatus } from '../../domain/value-objects/product-enums';

export interface BulkUpdateProductStatusInput {
  ids: string[];
  status: ProductStatus;
  actorUserId: string;
  ipAddress: string | null;
}

/** Acción masiva del listado admin (publicar/archivar varios productos a la vez). */
@Injectable()
export class BulkUpdateProductStatusUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: BulkUpdateProductStatusInput): Promise<void> {
    await this.products.bulkUpdateStatus(input.ids, input.status);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'catalog.product.bulk_status_updated',
      ipAddress: input.ipAddress,
      metadata: { productIds: input.ids, status: input.status },
    });
  }
}
