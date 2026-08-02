import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';

import { NavigationMenuStatus } from '../../domain/value-objects/navigation-enums';
import { NavigationItemDto } from './navigation-item.dto';

export class UpdateMenuDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  location?: string;

  @IsOptional()
  @IsEnum(NavigationMenuStatus)
  status?: NavigationMenuStatus;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => NavigationItemDto)
  items?: NavigationItemDto[];
}
