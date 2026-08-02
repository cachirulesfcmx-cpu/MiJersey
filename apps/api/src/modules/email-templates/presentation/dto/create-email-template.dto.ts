import { IsOptional, IsString, Length } from 'class-validator';

export class CreateEmailTemplateDto {
  @IsString()
  @Length(1, 150)
  name!: string;

  @IsString()
  @Length(1, 150)
  key!: string;

  @IsString()
  @Length(2, 5)
  language!: string;

  @IsString()
  @Length(1, 250)
  subject!: string;

  @IsString()
  html!: string;

  @IsString()
  text!: string;

  @IsOptional()
  @IsString()
  layoutId?: string;
}
