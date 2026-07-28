import { IsEnum, IsOptional, IsString, IsUrl, IsUUID, Length } from 'class-validator';

import { BrandStatus } from '../../domain/value-objects/brand-status';

export class UpdateBrandDto {
  @IsOptional()
  @IsString()
  @Length(1, 150)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 150)
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  @Length(0, 300)
  shortDescription?: string | null;

  @IsOptional()
  @IsUUID()
  logoMediaId?: string | null;

  @IsOptional()
  @IsUUID()
  coverMediaId?: string | null;

  @IsOptional()
  @IsUrl()
  website?: string | null;

  @IsOptional()
  @IsString()
  @Length(0, 100)
  country?: string | null;

  @IsOptional()
  @IsEnum(BrandStatus)
  status?: BrandStatus;
}
