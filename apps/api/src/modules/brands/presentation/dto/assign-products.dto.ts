import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class AssignProductsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  productIds!: string[];
}
