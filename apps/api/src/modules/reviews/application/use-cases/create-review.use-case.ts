import { Inject, Injectable } from '@nestjs/common';

import type { ReviewEntity } from '../../domain/entities/review.entity';
import { InvalidRatingError, ReviewProductNotFoundError } from '../../domain/errors/reviews.errors';
import type { ReviewRepositoryPort } from '../../domain/ports/review.repository.port';
import type { ReviewProductLookupPort } from '../../domain/ports/review-product-lookup.port';
import {
  MAX_RATING,
  MIN_RATING,
  REVIEW_PRODUCT_LOOKUP,
  REVIEW_REPOSITORY,
} from '../../reviews.constants';

export interface CreateReviewInput {
  slug: string;
  customerId?: string;
  authorName: string;
  rating: number;
  title?: string;
  body?: string;
}

/**
 * Toda reseña nueva entra `PENDING` (moderación manual) — nunca se muestra en el storefront hasta
 * que un admin la aprueba. `isVerifiedPurchase` se calcula una sola vez aquí, si hay `customerId`.
 */
@Injectable()
export class CreateReviewUseCase {
  constructor(
    @Inject(REVIEW_PRODUCT_LOOKUP) private readonly productLookup: ReviewProductLookupPort,
    @Inject(REVIEW_REPOSITORY) private readonly reviews: ReviewRepositoryPort,
  ) {}

  async execute(input: CreateReviewInput): Promise<ReviewEntity> {
    if (!Number.isInteger(input.rating) || input.rating < MIN_RATING || input.rating > MAX_RATING) {
      throw new InvalidRatingError();
    }

    const product = await this.productLookup.findPublicProductBySlug(input.slug);
    if (!product) throw new ReviewProductNotFoundError();

    const isVerifiedPurchase = input.customerId
      ? await this.productLookup.hasVerifiedPurchase(input.customerId, product.id)
      : false;

    return this.reviews.create({
      productId: product.id,
      customerId: input.customerId ?? null,
      authorName: input.authorName.trim(),
      rating: input.rating,
      title: input.title?.trim() || null,
      body: input.body?.trim() || null,
      isVerifiedPurchase,
    });
  }
}
