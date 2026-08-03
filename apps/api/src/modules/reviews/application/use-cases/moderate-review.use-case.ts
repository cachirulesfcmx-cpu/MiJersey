import { Inject, Injectable } from '@nestjs/common';

import type { ReviewEntity } from '../../domain/entities/review.entity';
import { ReviewNotFoundError } from '../../domain/errors/reviews.errors';
import type { ReviewRepositoryPort } from '../../domain/ports/review.repository.port';
import type { ReviewStatus } from '../../domain/value-objects/review-enums';
import { REVIEW_REPOSITORY } from '../../reviews.constants';

export interface ModerateReviewInput {
  id: string;
  status: ReviewStatus.APPROVED | ReviewStatus.REJECTED;
}

/** Aprueba o rechaza una reseña (admin) — se permite recalificar (ej. aprobada por error) sin un estado "bloqueado". */
@Injectable()
export class ModerateReviewUseCase {
  constructor(@Inject(REVIEW_REPOSITORY) private readonly reviews: ReviewRepositoryPort) {}

  async execute(input: ModerateReviewInput): Promise<ReviewEntity> {
    const existing = await this.reviews.findById(input.id);
    if (!existing) throw new ReviewNotFoundError();

    return this.reviews.updateStatus(input.id, input.status);
  }
}
