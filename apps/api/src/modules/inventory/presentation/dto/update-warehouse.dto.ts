import { IsEnum, IsOptional, IsString, Length } from 'class-validator';

import { WarehouseStatus } from '../../domain/value-objects/inventory-enums';

export class UpdateWarehouseDto {
  @IsOptional()
  @IsString()
  @Length(1, 150)
  name?: string;

  @IsOptional()
  @IsEnum(WarehouseStatus)
  status?: WarehouseStatus;
}
