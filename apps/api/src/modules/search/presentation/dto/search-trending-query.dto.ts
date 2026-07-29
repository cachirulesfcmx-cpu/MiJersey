import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

import { MAX_TRENDING_LIMIT } from '../../search.constants';

export class SearchTrendingQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_TRENDING_LIMIT)
  limit?: number;
}
