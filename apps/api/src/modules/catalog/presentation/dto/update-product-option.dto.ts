import { ArrayMinSize, IsArray, IsOptional, IsString, Length } from 'class-validator';

export class UpdateProductOptionDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  values?: string[];
}
