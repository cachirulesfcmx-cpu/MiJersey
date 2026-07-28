import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { PRODUCT_QUERY } from '../../brands.constants';
import type { ProductQueryPort } from '../../domain/ports/product-query.port';

export interface RemoveProductFromBrandInput {
  brandId: string;
  productId: string;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class RemoveProductFromBrandUseCase {
  constructor(
    @Inject(PRODUCT_QUERY) private readonly products: ProductQueryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: RemoveProductFromBrandInput): Promise<void> {
    await this.products.unassignFromBrand([input.productId]);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'brand.products.removed',
      ipAddress: input.ipAddress,
      metadata: { brandId: input.brandId, productId: input.productId },
    });
  }
}
