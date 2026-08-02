import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateEmailLayoutDto {
  @IsOptional()
  @IsString()
  @Length(1, 150)
  name?: string;

  @IsOptional()
  @IsString()
  html?: string;

  @IsOptional()
  @IsString()
  css?: string;
}
