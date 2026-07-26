import { IsIn, IsOptional, IsString, Length } from 'class-validator';

import { CategoryStatus } from '../../domain/value-objects/taxonomy-enums';

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @Length(1, 96)
  slug?: string;

  @IsOptional()
  @IsString()
  @Length(1, 150)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsIn(Object.values(CategoryStatus))
  status?: CategoryStatus;
}
