import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import {
  ATTRIBUTE_REPOSITORY,
  PRODUCT_ATTRIBUTE_REPOSITORY,
  PRODUCT_QUERY,
} from '../../attributes.constants';
import { AttributeNotFoundError, ProductNotFoundError } from '../../domain/errors/attribute.errors';
import type { AttributeRepositoryPort } from '../../domain/ports/attribute.repository.port';
import type { AssignAttributeData } from '../../domain/ports/product-attribute.repository.port';
import type { ProductAttributeRepositoryPort } from '../../domain/ports/product-attribute.repository.port';
import type { ProductQueryPort } from '../../domain/ports/product-query.port';
import { AttributeCacheService } from '../services/attribute-cache.service';
import { validateAssignmentValue } from './validate-attribute-assignment.util';

export interface BulkAttributeAssignmentInput {
  attributeId: string;
  valueId?: string | null;
  customValue?: string | null;
}

export interface BulkAssignAttributesToProductInput {
  productId: string;
  items: BulkAttributeAssignmentInput[];
  actorUserId: string;
  ipAddress: string | null;
}

/** Reemplaza el conjunto completo de atributos asignados a un producto en una sola operación ("acciones masivas"). */
@Injectable()
export class BulkAssignAttributesToProductUseCase {
  constructor(
    @Inject(ATTRIBUTE_REPOSITORY) private readonly attributes: AttributeRepositoryPort,
    @Inject(PRODUCT_ATTRIBUTE_REPOSITORY)
    private readonly productAttributes: ProductAttributeRepositoryPort,
    @Inject(PRODUCT_QUERY) private readonly productQuery: ProductQueryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
    private readonly cache: AttributeCacheService,
  ) {}

  async execute(input: BulkAssignAttributesToProductInput): Promise<void> {
    if (!(await this.productQuery.exists(input.productId))) {
      throw new ProductNotFoundError();
    }

    const attributeIds = input.items.map((item) => item.attributeId);
    const attributes = await this.attributes.findByIds(attributeIds);
    const attributesById = new Map(attributes.map((attribute) => [attribute.id, attribute]));

    const resolved: AssignAttributeData[] = input.items.map((item) => {
      const attribute = attributesById.get(item.attributeId);
      if (!attribute) {
        throw new AttributeNotFoundError();
      }
      return {
        attributeId: item.attributeId,
        ...validateAssignmentValue(attribute, item.valueId, item.customValue),
      };
    });

    await this.productAttributes.replaceForProduct(input.productId, resolved);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'attributes.product_attribute.bulk_assigned',
      ipAddress: input.ipAddress,
      metadata: { productId: input.productId, count: resolved.length },
    });

    if (attributes.some((attribute) => attribute.isFilterable)) {
      await this.cache.invalidateDefaultFacets();
    }
  }
}
