import { Inject, Injectable } from '@nestjs/common';

import { ATTRIBUTE_REPOSITORY, PRODUCT_ATTRIBUTE_REPOSITORY } from '../../attributes.constants';
import type { AttributeRepositoryPort } from '../../domain/ports/attribute.repository.port';
import type { ProductAttributeRepositoryPort } from '../../domain/ports/product-attribute.repository.port';
import type { AttributeType } from '../../domain/value-objects/attribute-enums';

export interface ProductAttributeView {
  attributeId: string;
  code: string;
  name: string;
  type: AttributeType;
  isRequired: boolean;
  valueId: string | null;
  valueLabel: string | null;
  customValue: string | null;
}

@Injectable()
export class ListProductAttributesUseCase {
  constructor(
    @Inject(ATTRIBUTE_REPOSITORY) private readonly attributes: AttributeRepositoryPort,
    @Inject(PRODUCT_ATTRIBUTE_REPOSITORY)
    private readonly productAttributes: ProductAttributeRepositoryPort,
  ) {}

  async execute(productId: string): Promise<ProductAttributeView[]> {
    const assignments = await this.productAttributes.findByProduct(productId);
    if (assignments.length === 0) return [];

    const attributeIds = [...new Set(assignments.map((assignment) => assignment.attributeId))];
    const attributes = await this.attributes.findByIds(attributeIds);
    const attributesById = new Map(attributes.map((attribute) => [attribute.id, attribute]));

    return assignments
      .map((assignment) => {
        const attribute = attributesById.get(assignment.attributeId);
        if (!attribute) return null;

        const value = assignment.valueId
          ? attribute.values.find((candidate) => candidate.id === assignment.valueId)
          : null;

        return {
          attributeId: attribute.id,
          code: attribute.code,
          name: attribute.name,
          type: attribute.type,
          isRequired: attribute.isRequired,
          valueId: assignment.valueId,
          valueLabel: value?.label ?? null,
          customValue: assignment.customValue,
        };
      })
      .filter((view): view is ProductAttributeView => view !== null)
      .sort((a, b) => a.name.localeCompare(b.name));
  }
}
