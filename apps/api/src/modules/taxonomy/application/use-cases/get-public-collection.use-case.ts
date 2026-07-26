import { Inject, Injectable } from '@nestjs/common';

import { CollectionNotFoundError } from '../../domain/errors/taxonomy.errors';
import type { CollectionRepositoryPort } from '../../domain/ports/collection.repository.port';
import type { ProductQueryPort, ProductSummary } from '../../domain/ports/product-query.port';
import { CollectionStatus, CollectionType } from '../../domain/value-objects/taxonomy-enums';
import { COLLECTION_REPOSITORY, PRODUCT_QUERY } from '../../taxonomy.constants';
import type { CollectionWithProducts } from './get-collection.use-case';
import { isPubliclyVisible } from './product-visibility.util';

export interface GetPublicCollectionInput {
  slug: string;
  page: number;
  pageSize: number;
}

/** Igual que GetCollectionUseCase, pero solo expone colecciones ACTIVE y productos ACTIVE+PUBLIC. */
@Injectable()
export class GetPublicCollectionUseCase {
  constructor(
    @Inject(COLLECTION_REPOSITORY) private readonly collections: CollectionRepositoryPort,
    @Inject(PRODUCT_QUERY) private readonly products: ProductQueryPort,
  ) {}

  async execute(input: GetPublicCollectionInput): Promise<CollectionWithProducts> {
    const collection = await this.collections.findBySlug(input.slug);
    if (!collection || collection.status !== CollectionStatus.ACTIVE) {
      throw new CollectionNotFoundError();
    }

    if (collection.type === CollectionType.SMART) {
      const { items, total } = await this.products.findMatchingRules({
        rules: collection.rules,
        matchType: collection.matchType,
        page: input.page,
        pageSize: input.pageSize,
      });
      const visible = items.filter(isPubliclyVisible);
      return { collection, products: visible, total };
    }

    const orderedIds = await this.collections.listManualProductIds(collection.id);
    const summaries = await this.products.findByIds(orderedIds);
    const byId = new Map(summaries.map((product) => [product.id, product]));
    const ordered = orderedIds
      .map((id) => byId.get(id))
      .filter((p): p is ProductSummary => !!p && isPubliclyVisible(p));

    const start = (input.page - 1) * input.pageSize;
    const page = ordered.slice(start, start + input.pageSize);

    return { collection, products: page, total: ordered.length };
  }
}
