import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsOptional, ValidateNested } from 'class-validator';

import { ThemeSectionDto } from './theme-section.dto';
import { UpdateThemeSettingsDto } from './update-theme-settings.dto';

export class UpdateThemeDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateThemeSettingsDto)
  settings?: UpdateThemeSettingsDto;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4)
  @ValidateNested({ each: true })
  @Type(() => ThemeSectionDto)
  sections?: ThemeSectionDto[];
}
