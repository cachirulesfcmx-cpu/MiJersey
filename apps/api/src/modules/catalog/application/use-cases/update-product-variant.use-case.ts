import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { PRODUCT_VARIANT_REPOSITORY } from '../../catalog.constants';
import type { ProductVariantEntity } from '../../domain/entities/product-variant.entity';
import {
  ProductVariantNotFoundError,
  VariantSkuAlreadyExistsError,
  VariantSlugAlreadyExistsError,
} from '../../domain/errors/catalog.errors';
import type { ProductVariantRepositoryPort } from '../../domain/ports/product-variant.repository.port';
import type { ProductVariantStatus } from '../../domain/value-objects/product-enums';
import { Sku } from '../../domain/value-objects/sku.vo';
import { Slug } from '../../domain/value-objects/slug.vo';

export interface UpdateProductVariantInput {
  id: string;
  sku?: string;
  slug?: string;
  title?: string;
  price?: number;
  compareAtPrice?: number | null;
  weight?: number | null;
  barcode?: string | null;
  imageId?: string | null;
  status?: ProductVariantStatus;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class UpdateProductVariantUseCase {
  constructor(
    @Inject(PRODUCT_VARIANT_REPOSITORY) private readonly variants: ProductVariantRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: UpdateProductVariantInput): Promise<ProductVariantEntity> {
    const existing = await this.variants.findById(input.id);
    if (!existing) {
      throw new ProductVariantNotFoundError();
    }

    let sku: string | undefined;
    if (input.sku) {
      sku = Sku.create(input.sku).toString();
      if (sku !== existing.sku && (await this.variants.existsBySku(sku, existing.id))) {
        throw new VariantSkuAlreadyExistsError();
      }
    }

    let slug: string | undefined;
    if (input.slug) {
      slug = Slug.create(input.slug).toString();
      if (slug !== existing.slug && (await this.variants.existsBySlug(slug, existing.id))) {
        throw new VariantSlugAlreadyExistsError();
      }
    }

    const updated = await this.variants.update(input.id, {
      ...(sku !== undefined ? { sku } : {}),
      ...(slug !== undefined ? { slug } : {}),
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.price !== undefined ? { price: input.price } : {}),
      ...(input.compareAtPrice !== undefined ? { compareAtPrice: input.compareAtPrice } : {}),
      ...(input.weight !== undefined ? { weight: input.weight } : {}),
      ...(input.barcode !== undefined ? { barcode: input.barcode?.trim() || null } : {}),
      ...(input.imageId !== undefined ? { imageId: input.imageId?.trim() || null } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    });

    if (sku !== undefined && sku !== existing.sku) {
      await this.auditLog.record({
        userId: input.actorUserId,
        action: 'catalog.variant.sku_changed',
        ipAddress: input.ipAddress,
        metadata: { variantId: updated.id, from: existing.sku, to: sku },
      });
    }

    if (input.price !== undefined && input.price !== existing.price) {
      await this.auditLog.record({
        userId: input.actorUserId,
        action: 'catalog.variant.price_changed',
        ipAddress: input.ipAddress,
        metadata: { variantId: updated.id, from: existing.price, to: input.price },
      });
    }

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'catalog.variant.updated',
      ipAddress: input.ipAddress,
      metadata: { variantId: updated.id },
    });

    return updated;
  }
}
