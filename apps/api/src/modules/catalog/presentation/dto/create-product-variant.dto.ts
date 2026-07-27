import {
  ArrayNotEmpty,
  IsArray,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Length,
  Min,
} from 'class-validator';

export class CreateProductVariantDto {
  @IsString()
  @Length(1, 64)
  sku!: string;

  @IsOptional()
  @IsString()
  @Length(1, 96)
  slug?: string;

  @IsString()
  @Length(1, 200)
  title!: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  compareAtPrice?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  weight?: number;

  @IsOptional()
  @IsString()
  @Length(1, 64)
  barcode?: string;

  @IsOptional()
  @IsString()
  imageId?: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  optionValueIds!: string[];
}
