import { IsEnum, IsOptional, IsString, Length } from 'class-validator';

import { ShipmentStatus } from '../../domain/value-objects/shipment-status';

export class UpdateShipmentStatusDto {
  @IsEnum(ShipmentStatus)
  status!: ShipmentStatus;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  note?: string;
}
