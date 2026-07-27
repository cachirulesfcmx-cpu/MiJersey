import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { PRODUCT_VARIANT_REPOSITORY } from '../../catalog.constants';
import type { ProductVariantRepositoryPort } from '../../domain/ports/product-variant.repository.port';
import type { ProductVariantStatus } from '../../domain/value-objects/product-enums';

export interface BulkUpdateVariantsInput {
  ids: string[];
  status?: ProductVariantStatus;
  price?: number;
  compareAtPrice?: number | null;
  actorUserId: string;
  ipAddress: string | null;
}

/** Edición masiva (sección 7/9 del spec): aplica el mismo cambio a varias variantes a la vez. */
@Injectable()
export class BulkUpdateVariantsUseCase {
  constructor(
    @Inject(PRODUCT_VARIANT_REPOSITORY) private readonly variants: ProductVariantRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: BulkUpdateVariantsInput): Promise<void> {
    await this.variants.bulkUpdate(input.ids, {
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.price !== undefined ? { price: input.price } : {}),
      ...(input.compareAtPrice !== undefined ? { compareAtPrice: input.compareAtPrice } : {}),
    });

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'catalog.variant.bulk_updated',
      ipAddress: input.ipAddress,
      metadata: { variantIds: input.ids },
    });
  }
}
