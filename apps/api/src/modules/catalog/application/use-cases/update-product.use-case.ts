import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { PRODUCT_REPOSITORY } from '../../catalog.constants';
import type { ProductEntity } from '../../domain/entities/product.entity';
import { ProductNotFoundError, SlugAlreadyExistsError } from '../../domain/errors/catalog.errors';
import type { ProductRepositoryPort } from '../../domain/ports/product.repository.port';
import type { ProductType, ProductVisibility } from '../../domain/value-objects/product-enums';
import { Slug } from '../../domain/value-objects/slug.vo';

export interface UpdateProductInput {
  id: string;
  name?: string;
  slug?: string;
  shortDescription?: string | null;
  description?: string | null;
  type?: ProductType;
  visibility?: ProductVisibility;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class UpdateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: UpdateProductInput): Promise<ProductEntity> {
    const existing = await this.products.findById(input.id);
    if (!existing) {
      throw new ProductNotFoundError();
    }

    let slug: string | undefined;
    if (input.slug) {
      slug = Slug.create(input.slug).toString();
      const owner = await this.products.findBySlug(slug);
      if (owner && owner.id !== input.id) {
        throw new SlugAlreadyExistsError();
      }
    }

    const updated = await this.products.update(input.id, {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(slug !== undefined ? { slug } : {}),
      ...(input.shortDescription !== undefined
        ? { shortDescription: input.shortDescription?.trim() || null }
        : {}),
      ...(input.description !== undefined
        ? { description: input.description?.trim() || null }
        : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.visibility !== undefined ? { visibility: input.visibility } : {}),
    });

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'catalog.product.updated',
      ipAddress: input.ipAddress,
      metadata: { productId: updated.id },
    });

    return updated;
  }
}
