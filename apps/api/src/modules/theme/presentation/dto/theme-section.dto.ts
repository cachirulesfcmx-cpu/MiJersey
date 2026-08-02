import { IsBoolean, IsEnum, IsObject, IsOptional } from 'class-validator';

import { ThemeSectionKey } from '../../domain/value-objects/theme-enums';

export class ThemeSectionDto {
  @IsEnum(ThemeSectionKey)
  section!: ThemeSectionKey;

  @IsObject()
  config!: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
