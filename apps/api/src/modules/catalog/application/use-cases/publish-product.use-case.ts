import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { PRODUCT_REPOSITORY } from '../../catalog.constants';
import { ProductNotFoundError } from '../../domain/errors/catalog.errors';
import type { ProductRepositoryPort } from '../../domain/ports/product.repository.port';
import { ProductStatus } from '../../domain/value-objects/product-enums';

export interface PublishProductInput {
  id: string;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class PublishProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: PublishProductInput): Promise<void> {
    const product = await this.products.findById(input.id);
    if (!product) {
      throw new ProductNotFoundError();
    }

    await this.products.updateStatus(input.id, ProductStatus.ACTIVE);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'catalog.product.published',
      ipAddress: input.ipAddress,
      metadata: { productId: input.id },
    });
  }
}
