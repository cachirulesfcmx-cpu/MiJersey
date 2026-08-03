import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';

import { MAX_RATING, MIN_RATING } from '../../reviews.constants';

export class CreateReviewDto {
  @IsString()
  @Length(1, 80)
  authorName!: string;

  @IsInt()
  @Min(MIN_RATING)
  @Max(MAX_RATING)
  rating!: number;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  title?: string;

  @IsOptional()
  @IsString()
  @Length(1, 2000)
  body?: string;
}
