import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, ValidateNested } from 'class-validator';

import { SystemSettingEntryDto } from './system-setting-entry.dto';

export class UpdateSystemSettingsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => SystemSettingEntryDto)
  settings!: SystemSettingEntryDto[];
}
