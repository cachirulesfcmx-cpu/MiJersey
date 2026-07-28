import { Inject, Injectable } from '@nestjs/common';

import { APP_CONFIG } from '../../../../config/env.config';
import type { AppConfig } from '../../../../config/env.schema';
import { GetSeoMetadataUseCase } from '../../../seo/application/use-cases/get-seo-metadata.use-case';
import {
  buildPublicSeoView,
  type PublicSeoView,
} from '../../../seo/domain/value-objects/public-seo-view';
import { SeoEntityType } from '../../../seo/domain/value-objects/seo-enums';
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

export type PublicCollectionWithProducts = CollectionWithProducts & { seo: PublicSeoView };

/** Igual que GetCollectionUseCase, pero solo expone colecciones ACTIVE y productos ACTIVE+PUBLIC. */
@Injectable()
export class GetPublicCollectionUseCase {
  constructor(
    @Inject(COLLECTION_REPOSITORY) private readonly collections: CollectionRepositoryPort,
    @Inject(PRODUCT_QUERY) private readonly products: ProductQueryPort,
    private readonly seoMetadata: GetSeoMetadataUseCase,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async execute(input: GetPublicCollectionInput): Promise<PublicCollectionWithProducts> {
    const collection = await this.collections.findBySlug(input.slug);
    if (!collection || collection.status !== CollectionStatus.ACTIVE) {
      throw new CollectionNotFoundError();
    }

    const seo = await this.buildSeo(
      collection.id,
      collection.name,
      collection.description,
      collection.slug,
    );

    if (collection.type === CollectionType.SMART) {
      const { items, total } = await this.products.findMatchingRules({
        rules: collection.rules,
        matchType: collection.matchType,
        page: input.page,
        pageSize: input.pageSize,
      });
      const visible = items.filter(isPubliclyVisible);
      return { collection, products: visible, total, seo };
    }

    const orderedIds = await this.collections.listManualProductIds(collection.id);
    const summaries = await this.products.findByIds(orderedIds);
    const byId = new Map(summaries.map((product) => [product.id, product]));
    const ordered = orderedIds
      .map((id) => byId.get(id))
      .filter((p): p is ProductSummary => !!p && isPubliclyVisible(p));

    const start = (input.page - 1) * input.pageSize;
    const page = ordered.slice(start, start + input.pageSize);

    return { collection, products: page, total: ordered.length, seo };
  }

  private async buildSeo(
    collectionId: string,
    name: string,
    description: string | null,
    slug: string,
  ): Promise<PublicSeoView> {
    const metadata = await this.seoMetadata.execute(SeoEntityType.COLLECTION, collectionId);
    return buildPublicSeoView(
      metadata,
      {
        title: name,
        description,
        url: `${this.config.publicWebUrl.replace(/\/$/, '')}/collections/${slug}`,
      },
      null,
    );
  }
}
