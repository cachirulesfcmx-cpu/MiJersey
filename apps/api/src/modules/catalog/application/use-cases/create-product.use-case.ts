import { slugify } from '@mijersey/shared-utils';
import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { PRODUCT_REPOSITORY } from '../../catalog.constants';
import type { ProductEntity } from '../../domain/entities/product.entity';
import { SkuAlreadyExistsError, SlugAlreadyExistsError } from '../../domain/errors/catalog.errors';
import type { ProductRepositoryPort } from '../../domain/ports/product.repository.port';
import { ProductType, ProductVisibility } from '../../domain/value-objects/product-enums';
import { Sku } from '../../domain/value-objects/sku.vo';
import { Slug } from '../../domain/value-objects/slug.vo';

export interface CreateProductInput {
  sku: string;
  slug?: string;
  name: string;
  shortDescription?: string;
  description?: string;
  type?: ProductType;
  visibility?: ProductVisibility;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: CreateProductInput): Promise<ProductEntity> {
    const sku = Sku.create(input.sku).toString();
    const slug = Slug.create(input.slug?.trim() ? input.slug : slugify(input.name)).toString();

    if (await this.products.existsBySku(sku)) {
      throw new SkuAlreadyExistsError();
    }

    if (await this.products.existsBySlug(slug)) {
      throw new SlugAlreadyExistsError();
    }

    const product = await this.products.create({
      sku,
      slug,
      name: input.name.trim(),
      shortDescription: input.shortDescription?.trim() || null,
      description: input.description?.trim() || null,
      type: input.type ?? ProductType.PHYSICAL,
      visibility: input.visibility ?? ProductVisibility.HIDDEN,
    });

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'catalog.product.created',
      ipAddress: input.ipAddress,
      metadata: { productId: product.id, sku: product.sku },
    });

    return product;
  }
}
