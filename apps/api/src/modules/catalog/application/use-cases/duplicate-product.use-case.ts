import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { PRODUCT_REPOSITORY } from '../../catalog.constants';
import type { ProductEntity } from '../../domain/entities/product.entity';
import { ProductNotFoundError } from '../../domain/errors/catalog.errors';
import type { ProductRepositoryPort } from '../../domain/ports/product.repository.port';
import { ProductVisibility } from '../../domain/value-objects/product-enums';

export interface DuplicateProductInput {
  id: string;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class DuplicateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: DuplicateProductInput): Promise<ProductEntity> {
    const source = await this.products.findById(input.id);
    if (!source) {
      throw new ProductNotFoundError();
    }

    const sku = await this.findAvailable(`${source.sku}-COPY`, (value) =>
      this.products.existsBySku(value),
    );
    const slug = await this.findAvailable(`${source.slug}-copy`, (value) =>
      this.products.existsBySlug(value),
    );

    const duplicate = await this.products.create({
      sku,
      slug,
      name: `${source.name} (copia)`,
      shortDescription: source.shortDescription,
      description: source.description,
      type: source.type,
      visibility: ProductVisibility.HIDDEN,
    });

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'catalog.product.duplicated',
      ipAddress: input.ipAddress,
      metadata: { sourceProductId: source.id, productId: duplicate.id },
    });

    return duplicate;
  }

  /** Prueba `base`, luego `base-2`, `base-3`... hasta encontrar un valor libre. */
  private async findAvailable(
    base: string,
    exists: (value: string) => Promise<boolean>,
  ): Promise<string> {
    let candidate = base;
    let attempt = 2;

    while (await exists(candidate)) {
      candidate = `${base}-${attempt}`;
      attempt += 1;
    }

    return candidate;
  }
}
