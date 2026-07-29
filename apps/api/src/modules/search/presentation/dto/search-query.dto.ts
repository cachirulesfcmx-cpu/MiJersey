import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../../search.constants';

export class SearchQueryDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  q!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  pageSize: number = DEFAULT_PAGE_SIZE;

  /** Id anónimo generado por el storefront (no hay sesión de invitado a nivel de backend todavía) — usado para "historial de búsquedas" (016 §2). */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sessionId?: string;
}
