import { IsBoolean, IsEnum, IsObject, IsOptional, IsString, Length } from 'class-validator';

import { HomeSectionStatus, HomeSectionType } from '../../domain/value-objects/home-section-enums';

export class CreateHomeSectionDto {
  @IsEnum(HomeSectionType)
  type!: HomeSectionType;

  @IsString()
  @Length(1, 120)
  title!: string;

  @IsObject()
  configuration!: Record<string, unknown>;

  @IsOptional()
  @IsEnum(HomeSectionStatus)
  status?: HomeSectionStatus;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}
