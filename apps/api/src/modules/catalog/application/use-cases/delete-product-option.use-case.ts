import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { PRODUCT_OPTION_REPOSITORY, PRODUCT_VARIANT_REPOSITORY } from '../../catalog.constants';
import {
  ProductHasVariantsError,
  ProductOptionNotFoundError,
} from '../../domain/errors/catalog.errors';
import type { ProductOptionRepositoryPort } from '../../domain/ports/product-option.repository.port';
import type { ProductVariantRepositoryPort } from '../../domain/ports/product-variant.repository.port';

export interface DeleteProductOptionInput {
  id: string;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class DeleteProductOptionUseCase {
  constructor(
    @Inject(PRODUCT_OPTION_REPOSITORY) private readonly options: ProductOptionRepositoryPort,
    @Inject(PRODUCT_VARIANT_REPOSITORY) private readonly variants: ProductVariantRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: DeleteProductOptionInput): Promise<void> {
    const option = await this.options.findById(input.id);
    if (!option) {
      throw new ProductOptionNotFoundError();
    }

    const { total } = await this.variants.findMany({
      productId: option.productId,
      page: 1,
      pageSize: 1,
    });
    if (total > 0) {
      throw new ProductHasVariantsError();
    }

    await this.options.delete(input.id);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'catalog.option.deleted',
      ipAddress: input.ipAddress,
      metadata: { optionId: input.id, productId: option.productId },
    });
  }
}
