import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

import { RmaStatus } from '../../domain/value-objects/support-enums';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export class ListRmaQueryDto {
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

  @IsOptional()
  @IsEnum(RmaStatus)
  status?: RmaStatus;
}
