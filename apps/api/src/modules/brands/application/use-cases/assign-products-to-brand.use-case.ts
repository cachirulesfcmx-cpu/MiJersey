import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { BRAND_REPOSITORY, PRODUCT_QUERY } from '../../brands.constants';
import { BrandNotFoundError, ProductNotFoundError } from '../../domain/errors/brand.errors';
import type { BrandRepositoryPort } from '../../domain/ports/brand.repository.port';
import type { ProductQueryPort } from '../../domain/ports/product-query.port';

export interface AssignProductsToBrandInput {
  brandId: string;
  productIds: string[];
  actorUserId: string;
  ipAddress: string | null;
}

/** Un producto pertenece a una marca como máximo (spec §4): asignar reemplaza cualquier marca previa. */
@Injectable()
export class AssignProductsToBrandUseCase {
  constructor(
    @Inject(BRAND_REPOSITORY) private readonly brands: BrandRepositoryPort,
    @Inject(PRODUCT_QUERY) private readonly products: ProductQueryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: AssignProductsToBrandInput): Promise<void> {
    if (!(await this.brands.findById(input.brandId))) {
      throw new BrandNotFoundError();
    }

    const found = await this.products.findByIds(input.productIds);
    if (found.length !== new Set(input.productIds).size) {
      throw new ProductNotFoundError();
    }

    await this.products.assignToBrand(input.productIds, input.brandId);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'brand.products.assigned',
      ipAddress: input.ipAddress,
      metadata: { brandId: input.brandId, productIds: input.productIds },
    });
  }
}
