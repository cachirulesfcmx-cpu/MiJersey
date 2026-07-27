import { IsArray, IsEnum, IsOptional, IsString, IsUUID, Length } from 'class-validator';

import { MediaAssetStatus } from '../../domain/value-objects/media-enums';

export class UpdateMediaDto {
  @IsOptional()
  @IsString()
  @Length(0, 200)
  title?: string;

  @IsOptional()
  @IsString()
  @Length(0, 300)
  altText?: string;

  @IsOptional()
  @IsUUID()
  folderId?: string | null;

  @IsOptional()
  @IsEnum(MediaAssetStatus)
  status?: MediaAssetStatus;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
