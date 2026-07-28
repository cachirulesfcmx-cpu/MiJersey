import { IsOptional, IsString, IsUUID } from 'class-validator';

export class FiltersQueryDto {
  /** JSON: [{ "attributeId": "...", "valueIds": ["..."] }, { "attributeId": "...", "customValues": ["..."] }] */
  @IsOptional()
  @IsString()
  filters?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  brandId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
