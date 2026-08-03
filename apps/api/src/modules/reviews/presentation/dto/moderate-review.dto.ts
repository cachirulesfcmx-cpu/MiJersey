import { IsIn } from 'class-validator';

import { ReviewStatus } from '../../domain/value-objects/review-enums';

export class ModerateReviewDto {
  @IsIn([ReviewStatus.APPROVED, ReviewStatus.REJECTED])
  status!: ReviewStatus.APPROVED | ReviewStatus.REJECTED;
}
