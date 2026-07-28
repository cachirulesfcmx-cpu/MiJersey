import { IsBoolean, IsEnum, IsObject, IsOptional, IsString, Length } from 'class-validator';

import { HomeSectionStatus } from '../../domain/value-objects/home-section-enums';

export class UpdateHomeSectionDto {
  @IsOptional()
  @IsString()
  @Length(1, 120)
  title?: string;

  @IsOptional()
  @IsObject()
  configuration?: Record<string, unknown>;

  @IsOptional()
  @IsEnum(HomeSectionStatus)
  status?: HomeSectionStatus;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}
