import { ArrayMinSize, ArrayNotEmpty, IsArray, IsString, Length } from 'class-validator';

export class CreateProductOptionDto {
  @IsString()
  @Length(1, 100)
  name!: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMinSize(1)
  @IsString({ each: true })
  values!: string[];
}
