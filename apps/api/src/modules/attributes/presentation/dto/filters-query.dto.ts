import { IsOptional, IsString } from 'class-validator';

export class FiltersQueryDto {
  /** JSON: [{ "attributeId": "...", "valueIds": ["..."] }, { "attributeId": "...", "customValues": ["..."] }] */
  @IsOptional()
  @IsString()
  filters?: string;
}
