import { IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class CreateCategoryDto {
  @IsOptional()
  @IsString()
  @Length(1, 96)
  slug?: string;

  @IsString()
  @Length(1, 150)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}
