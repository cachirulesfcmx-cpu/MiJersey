import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class CollectionProductIdsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  productIds!: string[];
}
