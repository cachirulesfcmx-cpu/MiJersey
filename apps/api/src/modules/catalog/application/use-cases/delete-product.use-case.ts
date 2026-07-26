import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { PRODUCT_REPOSITORY } from '../../catalog.constants';
import { ProductNotFoundError } from '../../domain/errors/catalog.errors';
import type { ProductRepositoryPort } from '../../domain/ports/product.repository.port';

export interface DeleteProductInput {
  id: string;
  actorUserId: string;
  ipAddress: string | null;
}

/** Eliminación lógica: el producto deja de listarse en cualquier vista, pero no se borra de la base. */
@Injectable()
export class DeleteProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: DeleteProductInput): Promise<void> {
    const product = await this.products.findById(input.id);
    if (!product) {
      throw new ProductNotFoundError();
    }

    await this.products.softDelete(input.id);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'catalog.product.deleted',
      ipAddress: input.ipAddress,
      metadata: { productId: input.id },
    });
  }
}
