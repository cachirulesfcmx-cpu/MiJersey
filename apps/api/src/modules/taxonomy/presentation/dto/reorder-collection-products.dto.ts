import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class ReorderCollectionProductsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  orderedProductIds!: string[];
}
