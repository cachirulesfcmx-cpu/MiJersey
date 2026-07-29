import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

import { MAX_SUGGESTIONS_LIMIT } from '../../search.constants';

export class SearchSuggestionsQueryDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  q!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_SUGGESTIONS_LIMIT)
  limit?: number;
}
