import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import {
  ATTRIBUTE_REPOSITORY,
  PRODUCT_ATTRIBUTE_REPOSITORY,
  PRODUCT_QUERY,
} from '../../attributes.constants';
import type { ProductAttributeEntity } from '../../domain/entities/product-attribute.entity';
import { AttributeNotFoundError, ProductNotFoundError } from '../../domain/errors/attribute.errors';
import type { AttributeRepositoryPort } from '../../domain/ports/attribute.repository.port';
import type { ProductAttributeRepositoryPort } from '../../domain/ports/product-attribute.repository.port';
import type { ProductQueryPort } from '../../domain/ports/product-query.port';
import { AttributeCacheService } from '../services/attribute-cache.service';
import { validateAssignmentValue } from './validate-attribute-assignment.util';

export interface AssignAttributeToProductInput {
  productId: string;
  attributeId: string;
  valueId?: string | null;
  customValue?: string | null;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class AssignAttributeToProductUseCase {
  constructor(
    @Inject(ATTRIBUTE_REPOSITORY) private readonly attributes: AttributeRepositoryPort,
    @Inject(PRODUCT_ATTRIBUTE_REPOSITORY)
    private readonly productAttributes: ProductAttributeRepositoryPort,
    @Inject(PRODUCT_QUERY) private readonly productQuery: ProductQueryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
    private readonly cache: AttributeCacheService,
  ) {}

  async execute(input: AssignAttributeToProductInput): Promise<ProductAttributeEntity> {
    if (!(await this.productQuery.exists(input.productId))) {
      throw new ProductNotFoundError();
    }

    const attribute = await this.attributes.findById(input.attributeId);
    if (!attribute) {
      throw new AttributeNotFoundError();
    }

    const resolved = validateAssignmentValue(attribute, input.valueId, input.customValue);

    const assignment = await this.productAttributes.upsert(input.productId, {
      attributeId: input.attributeId,
      ...resolved,
    });

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'attributes.product_attribute.assigned',
      ipAddress: input.ipAddress,
      metadata: { productId: input.productId, attributeId: input.attributeId },
    });

    if (attribute.isFilterable) {
      await this.cache.invalidateDefaultFacets();
    }

    return assignment;
  }
}
