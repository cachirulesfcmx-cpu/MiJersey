import { IsOptional, IsString, Length } from 'class-validator';

export class CreateEmailLayoutDto {
  @IsString()
  @Length(1, 150)
  name!: string;

  @IsString()
  html!: string;

  @IsOptional()
  @IsString()
  css?: string;
}
