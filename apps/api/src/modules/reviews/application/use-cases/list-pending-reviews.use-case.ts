import { Inject, Injectable } from '@nestjs/common';

import type {
  PaginatedReviews,
  ReviewRepositoryPort,
} from '../../domain/ports/review.repository.port';
import { REVIEW_REPOSITORY } from '../../reviews.constants';

export interface ListPendingReviewsInput {
  page: number;
  pageSize: number;
}

/** Cola de moderación (admin) — reseñas `PENDING` más antiguas primero (FIFO, mismo criterio que Support Tickets). */
@Injectable()
export class ListPendingReviewsUseCase {
  constructor(@Inject(REVIEW_REPOSITORY) private readonly reviews: ReviewRepositoryPort) {}

  execute(input: ListPendingReviewsInput): Promise<PaginatedReviews> {
    return this.reviews.findPending(input.page, input.pageSize);
  }
}
