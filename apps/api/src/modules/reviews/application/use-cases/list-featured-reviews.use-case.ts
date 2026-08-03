import { Inject, Injectable } from '@nestjs/common';

import { MediaUsageService } from '../../../media/application/services/media-usage.service';
import type { ReviewEntity } from '../../domain/entities/review.entity';
import type { ReviewRepositoryPort } from '../../domain/ports/review.repository.port';
import type { ReviewProductLookupPort } from '../../domain/ports/review-product-lookup.port';
import { REVIEW_PRODUCT_LOOKUP, REVIEW_REPOSITORY } from '../../reviews.constants';

export interface FeaturedReviewItem {
  review: ReviewEntity;
  product: { slug: string; name: string; imageUrl: string | null } | null;
}

const DEFAULT_LIMIT = 8;

/** Mejores reseñas reales (APPROVED, rating >= 4) con el producto resuelto — para la sección de reseñas del home. Ningún dato inventado: si no hay reseñas aprobadas todavía, devuelve una lista vacía. */
@Injectable()
export class ListFeaturedReviewsUseCase {
  constructor(
    @Inject(REVIEW_REPOSITORY) private readonly reviews: ReviewRepositoryPort,
    @Inject(REVIEW_PRODUCT_LOOKUP) private readonly productLookup: ReviewProductLookupPort,
    private readonly mediaUsage: MediaUsageService,
  ) {}

  async execute(limit = DEFAULT_LIMIT): Promise<FeaturedReviewItem[]> {
    const reviews = await this.reviews.findFeatured(limit);
    if (reviews.length === 0) return [];

    const productIds = [...new Set(reviews.map((r) => r.productId))];
    const products = await this.productLookup.findProductsByIds(productIds);
    const productMap = new Map(products.map((p) => [p.id, p]));

    const mediaIds = [
      ...new Set(products.map((p) => p.imageMediaId).filter((id): id is string => !!id)),
    ];
    const mediaEntries = await Promise.all(
      mediaIds.map(async (id) => [id, await this.mediaUsage.resolveUrls(id)] as const),
    );
    const mediaMap = new Map(mediaEntries);

    return reviews.map((review) => {
      const product = productMap.get(review.productId);
      return {
        review,
        product: product
          ? {
              slug: product.slug,
              name: product.name,
              imageUrl: product.imageMediaId
                ? (mediaMap.get(product.imageMediaId)?.url ?? null)
                : null,
            }
          : null,
      };
    });
  }
}
