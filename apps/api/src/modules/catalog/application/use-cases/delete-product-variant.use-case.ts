import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { PRODUCT_VARIANT_REPOSITORY } from '../../catalog.constants';
import { ProductVariantNotFoundError } from '../../domain/errors/catalog.errors';
import type { ProductVariantRepositoryPort } from '../../domain/ports/product-variant.repository.port';

export interface DeleteProductVariantInput {
  id: string;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class DeleteProductVariantUseCase {
  constructor(
    @Inject(PRODUCT_VARIANT_REPOSITORY) private readonly variants: ProductVariantRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: DeleteProductVariantInput): Promise<void> {
    const variant = await this.variants.findById(input.id);
    if (!variant) {
      throw new ProductVariantNotFoundError();
    }

    await this.variants.delete(input.id);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'catalog.variant.deleted',
      ipAddress: input.ipAddress,
      metadata: { variantId: input.id, productId: variant.productId },
    });
  }
}
