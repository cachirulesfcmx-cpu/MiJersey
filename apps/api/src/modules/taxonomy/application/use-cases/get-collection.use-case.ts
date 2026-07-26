import { Inject, Injectable } from '@nestjs/common';

import type { CollectionEntity } from '../../domain/entities/collection.entity';
import { CollectionNotFoundError } from '../../domain/errors/taxonomy.errors';
import type { CollectionRepositoryPort } from '../../domain/ports/collection.repository.port';
import type { ProductQueryPort, ProductSummary } from '../../domain/ports/product-query.port';
import { CollectionType } from '../../domain/value-objects/taxonomy-enums';
import { COLLECTION_REPOSITORY, PRODUCT_QUERY } from '../../taxonomy.constants';

export interface GetCollectionInput {
  id: string;
  page: number;
  pageSize: number;
}

export interface CollectionWithProducts {
  collection: CollectionEntity;
  products: ProductSummary[];
  total: number;
}

/** Resuelve la membresía de productos: lista guardada (MANUAL) o consulta en vivo (SMART). */
@Injectable()
export class GetCollectionUseCase {
  constructor(
    @Inject(COLLECTION_REPOSITORY) private readonly collections: CollectionRepositoryPort,
    @Inject(PRODUCT_QUERY) private readonly products: ProductQueryPort,
  ) {}

  async execute(input: GetCollectionInput): Promise<CollectionWithProducts> {
    const collection = await this.collections.findById(input.id);
    if (!collection) {
      throw new CollectionNotFoundError();
    }

    if (collection.type === CollectionType.SMART) {
      const { items, total } = await this.products.findMatchingRules({
        rules: collection.rules,
        matchType: collection.matchType,
        page: input.page,
        pageSize: input.pageSize,
      });
      return { collection, products: items, total };
    }

    const orderedIds = await this.collections.listManualProductIds(collection.id);
    const summaries = await this.products.findByIds(orderedIds);
    const byId = new Map(summaries.map((product) => [product.id, product]));
    const ordered = orderedIds.map((id) => byId.get(id)).filter((p): p is ProductSummary => !!p);

    const start = (input.page - 1) * input.pageSize;
    const page = ordered.slice(start, start + input.pageSize);

    return { collection, products: page, total: ordered.length };
  }
}
