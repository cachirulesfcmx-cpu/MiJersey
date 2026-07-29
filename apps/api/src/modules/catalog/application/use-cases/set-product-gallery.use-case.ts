import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { MediaUsageService } from '../../../media/application/services/media-usage.service';
import { PRODUCT_MEDIA_REPOSITORY, PRODUCT_REPOSITORY } from '../../catalog.constants';
import { ProductNotFoundError } from '../../domain/errors/catalog.errors';
import type { ProductRepositoryPort } from '../../domain/ports/product.repository.port';
import type { ProductMediaRepositoryPort } from '../../domain/ports/product-media.repository.port';

const REFERENCE_TYPE = 'product.gallery';

export interface SetProductGalleryInput {
  productId: string;
  mediaIds: string[];
  actorUserId: string;
  ipAddress: string | null;
}

/** Reemplaza toda la galería del producto y ajusta el uso de medios (registra los nuevos, libera los que ya no están) — mismo patrón que HomeMediaUsageService (013). */
@Injectable()
export class SetProductGalleryUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepositoryPort,
    @Inject(PRODUCT_MEDIA_REPOSITORY) private readonly media: ProductMediaRepositoryPort,
    private readonly mediaUsage: MediaUsageService,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: SetProductGalleryInput): Promise<void> {
    if (!(await this.products.findById(input.productId))) {
      throw new ProductNotFoundError();
    }

    const existing = await this.media.list(input.productId);
    const existingIds = new Set(existing.map((item) => item.mediaId));
    const nextIds = new Set(input.mediaIds);

    const added = input.mediaIds.filter((id) => !existingIds.has(id));
    const removed = [...existingIds].filter((id) => !nextIds.has(id));

    await Promise.all([
      ...added.map((id) => this.mediaUsage.recordUsage(id, REFERENCE_TYPE, input.productId)),
      ...removed.map((id) => this.mediaUsage.removeUsage(id, REFERENCE_TYPE, input.productId)),
    ]);

    await this.media.replaceAll(input.productId, input.mediaIds);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'product.gallery.updated',
      ipAddress: input.ipAddress,
      metadata: { productId: input.productId, mediaIds: input.mediaIds },
    });
  }
}
