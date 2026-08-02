import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';

import { NavigationItemDto } from './navigation-item.dto';

export class CreateMenuDto {
  @IsString()
  @Length(1, 100)
  name!: string;

  @IsString()
  @Length(1, 50)
  location!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => NavigationItemDto)
  items?: NavigationItemDto[];
}
