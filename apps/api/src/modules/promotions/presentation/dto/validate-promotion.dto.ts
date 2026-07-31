import { IsOptional, IsString, Length } from 'class-validator';

export class ValidatePromotionDto {
  @IsOptional()
  @IsString()
  @Length(1, 50)
  code?: string;
}
