import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { PRODUCT_OPTION_REPOSITORY } from '../../catalog.constants';
import type { ProductOptionEntity } from '../../domain/entities/product-option.entity';
import {
  DuplicateOptionNameError,
  OptionValueInUseError,
  ProductOptionNotFoundError,
} from '../../domain/errors/catalog.errors';
import type { ProductOptionRepositoryPort } from '../../domain/ports/product-option.repository.port';

export interface UpdateProductOptionInput {
  id: string;
  name?: string;
  values?: string[];
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class UpdateProductOptionUseCase {
  constructor(
    @Inject(PRODUCT_OPTION_REPOSITORY) private readonly options: ProductOptionRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: UpdateProductOptionInput): Promise<ProductOptionEntity> {
    const existing = await this.options.findById(input.id);
    if (!existing) {
      throw new ProductOptionNotFoundError();
    }

    if (input.name !== undefined) {
      const name = input.name.trim();
      if (
        name !== existing.name &&
        (await this.options.existsByName(existing.productId, name, existing.id))
      ) {
        throw new DuplicateOptionNameError();
      }
      await this.options.updateName(input.id, name);
    }

    if (input.values !== undefined) {
      const desired = input.values.map((value) => value.trim()).filter(Boolean);
      const removed = existing.values.filter((value) => !desired.includes(value.value));

      for (const value of removed) {
        if ((await this.options.countVariantsUsingValue(value.id)) > 0) {
          throw new OptionValueInUseError();
        }
      }

      await this.options.replaceValues(input.id, desired);
    }

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'catalog.option.updated',
      ipAddress: input.ipAddress,
      metadata: { optionId: input.id },
    });

    return (await this.options.findById(input.id)) as ProductOptionEntity;
  }
}
