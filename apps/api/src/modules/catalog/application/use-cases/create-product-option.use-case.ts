import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { PRODUCT_OPTION_REPOSITORY, PRODUCT_REPOSITORY } from '../../catalog.constants';
import type { ProductOptionEntity } from '../../domain/entities/product-option.entity';
import { DuplicateOptionNameError, ProductNotFoundError } from '../../domain/errors/catalog.errors';
import type { ProductRepositoryPort } from '../../domain/ports/product.repository.port';
import type { ProductOptionRepositoryPort } from '../../domain/ports/product-option.repository.port';

export interface CreateProductOptionInput {
  productId: string;
  name: string;
  values: string[];
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class CreateProductOptionUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepositoryPort,
    @Inject(PRODUCT_OPTION_REPOSITORY) private readonly options: ProductOptionRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: CreateProductOptionInput): Promise<ProductOptionEntity> {
    if (!(await this.products.findById(input.productId))) {
      throw new ProductNotFoundError();
    }

    const name = input.name.trim();
    if (await this.options.existsByName(input.productId, name)) {
      throw new DuplicateOptionNameError();
    }

    const existing = await this.options.findByProductId(input.productId);
    const values = input.values.map((value) => value.trim()).filter(Boolean);

    const option = await this.options.create({
      productId: input.productId,
      name,
      position: existing.length,
      values,
    });

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'catalog.option.created',
      ipAddress: input.ipAddress,
      metadata: { productId: input.productId, optionId: option.id },
    });

    return option;
  }
}
