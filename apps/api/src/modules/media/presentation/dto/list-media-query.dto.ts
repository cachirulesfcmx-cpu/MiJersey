import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

import { MediaAssetStatus, MediaType } from '../../domain/value-objects/media-enums';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../../media.constants';

export class ListMediaQueryDto {
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
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  folderId?: string;

  @IsOptional()
  @IsEnum(MediaType)
  type?: MediaType;

  @IsOptional()
  @IsEnum(MediaAssetStatus)
  status?: MediaAssetStatus;

  @IsOptional()
  @IsUUID()
  tagId?: string;
}
