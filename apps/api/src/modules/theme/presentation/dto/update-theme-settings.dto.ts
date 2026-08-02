import { IsHexColor, IsOptional, IsString, IsUrl, Length } from 'class-validator';

export class UpdateThemeSettingsDto {
  @IsOptional()
  @IsString()
  @Length(1, 150)
  siteName?: string;

  @IsOptional()
  @IsUrl()
  logo?: string;

  @IsOptional()
  @IsUrl()
  favicon?: string;

  @IsOptional()
  @IsHexColor()
  primaryColor?: string;

  @IsOptional()
  @IsHexColor()
  secondaryColor?: string;

  @IsOptional()
  @IsString()
  @Length(1, 150)
  typography?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  borderRadius?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  spacingScale?: string;
}
