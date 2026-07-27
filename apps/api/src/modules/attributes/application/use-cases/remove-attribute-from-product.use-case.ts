import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { ATTRIBUTE_REPOSITORY, PRODUCT_ATTRIBUTE_REPOSITORY } from '../../attributes.constants';
import { AttributeNotFoundError } from '../../domain/errors/attribute.errors';
import type { AttributeRepositoryPort } from '../../domain/ports/attribute.repository.port';
import type { ProductAttributeRepositoryPort } from '../../domain/ports/product-attribute.repository.port';
import { AttributeCacheService } from '../services/attribute-cache.service';

export interface RemoveAttributeFromProductInput {
  productId: string;
  attributeId: string;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class RemoveAttributeFromProductUseCase {
  constructor(
    @Inject(ATTRIBUTE_REPOSITORY) private readonly attributes: AttributeRepositoryPort,
    @Inject(PRODUCT_ATTRIBUTE_REPOSITORY)
    private readonly productAttributes: ProductAttributeRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
    private readonly cache: AttributeCacheService,
  ) {}

  async execute(input: RemoveAttributeFromProductInput): Promise<void> {
    const attribute = await this.attributes.findById(input.attributeId);
    if (!attribute) {
      throw new AttributeNotFoundError();
    }

    await this.productAttributes.remove(input.productId, input.attributeId);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'attributes.product_attribute.removed',
      ipAddress: input.ipAddress,
      metadata: { productId: input.productId, attributeId: input.attributeId },
    });

    if (attribute.isFilterable) {
      await this.cache.invalidateDefaultFacets();
    }
  }
}
