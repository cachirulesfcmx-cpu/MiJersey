import { IsOptional, IsString } from 'class-validator';

export class ListSystemSettingsQueryDto {
  @IsOptional()
  @IsString()
  category?: string;
}
