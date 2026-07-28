import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { MediaUsageService } from '../../../media/application/services/media-usage.service';
import { BRAND_REPOSITORY, PRODUCT_QUERY } from '../../brands.constants';
import { BrandHasProductsError, BrandNotFoundError } from '../../domain/errors/brand.errors';
import type { BrandRepositoryPort } from '../../domain/ports/brand.repository.port';
import type { ProductQueryPort } from '../../domain/ports/product-query.port';

const BRAND_LOGO_REFERENCE_TYPE = 'brand.logo';
const BRAND_COVER_REFERENCE_TYPE = 'brand.cover';

export interface DeleteBrandInput {
  id: string;
  /** Acción explícita requerida por spec §4 para eliminar una marca con productos asociados. */
  force?: boolean;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class DeleteBrandUseCase {
  constructor(
    @Inject(BRAND_REPOSITORY) private readonly brands: BrandRepositoryPort,
    @Inject(PRODUCT_QUERY) private readonly products: ProductQueryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
    private readonly mediaUsage: MediaUsageService,
  ) {}

  async execute(input: DeleteBrandInput): Promise<void> {
    const brand = await this.brands.findById(input.id);
    if (!brand) {
      throw new BrandNotFoundError();
    }

    const productCount = await this.products.countByBrand(input.id);
    if (productCount > 0) {
      if (!input.force) {
        throw new BrandHasProductsError();
      }
      await this.products.unassignAllFromBrand(input.id);
    }

    if (brand.logoMediaId) {
      await this.mediaUsage.removeUsage(brand.logoMediaId, BRAND_LOGO_REFERENCE_TYPE, brand.id);
    }
    if (brand.coverMediaId) {
      await this.mediaUsage.removeUsage(brand.coverMediaId, BRAND_COVER_REFERENCE_TYPE, brand.id);
    }

    await this.brands.delete(input.id);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'brand.deleted',
      ipAddress: input.ipAddress,
      metadata: { brandId: input.id, unassignedProducts: productCount },
    });
  }
}
