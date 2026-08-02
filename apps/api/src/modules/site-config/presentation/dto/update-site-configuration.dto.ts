import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class UpdateSiteConfigurationDto {
  @IsOptional()
  @IsString()
  @Length(1, 150)
  siteName?: string;

  @IsOptional()
  @IsString()
  @Length(1, 253)
  defaultDomain?: string;

  @IsOptional()
  @IsString()
  @Length(2, 5)
  defaultLanguage?: string;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  defaultCurrency?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  timezone?: string;

  @IsOptional()
  @IsString()
  @Length(5, 5)
  locale?: string;

  @IsOptional()
  @IsEmail()
  supportEmail?: string;

  @IsOptional()
  @IsString()
  @Length(1, 30)
  supportPhone?: string;
}
