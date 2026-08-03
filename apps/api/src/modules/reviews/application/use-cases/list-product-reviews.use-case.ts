import { Inject, Injectable } from '@nestjs/common';

import type { ReviewEntity } from '../../domain/entities/review.entity';
import { ReviewProductNotFoundError } from '../../domain/errors/reviews.errors';
import type {
  ReviewRepositoryPort,
  ReviewSummary,
} from '../../domain/ports/review.repository.port';
import type { ReviewProductLookupPort } from '../../domain/ports/review-product-lookup.port';
import { REVIEW_PRODUCT_LOOKUP, REVIEW_REPOSITORY } from '../../reviews.constants';

export interface ListProductReviewsInput {
  slug: string;
  page: number;
  pageSize: number;
}

export interface ListProductReviewsResult {
  items: ReviewEntity[];
  total: number;
  summary: ReviewSummary;
}

/** Solo reseñas `APPROVED` — mismo criterio de "solo lo publicado es público" que Home/Blog. */
@Injectable()
export class ListProductReviewsUseCase {
  constructor(
    @Inject(REVIEW_PRODUCT_LOOKUP) private readonly productLookup: ReviewProductLookupPort,
    @Inject(REVIEW_REPOSITORY) private readonly reviews: ReviewRepositoryPort,
  ) {}

  async execute(input: ListProductReviewsInput): Promise<ListProductReviewsResult> {
    const product = await this.productLookup.findPublicProductBySlug(input.slug);
    if (!product) throw new ReviewProductNotFoundError();

    const [{ items, total }, summary] = await Promise.all([
      this.reviews.findApprovedByProduct(product.id, input.page, input.pageSize),
      this.reviews.summarizeApproved(product.id),
    ]);

    return { items, total, summary };
  }
}
