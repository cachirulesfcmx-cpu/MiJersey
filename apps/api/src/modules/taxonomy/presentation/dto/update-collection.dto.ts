import { IsIn, IsOptional, IsString, Length } from 'class-validator';

import { CollectionStatus } from '../../domain/value-objects/taxonomy-enums';

export class UpdateCollectionDto {
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
  @IsIn(Object.values(CollectionStatus))
  status?: CollectionStatus;
}
