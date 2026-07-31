import { IsString, IsUUID, Length } from 'class-validator';

export class CreateShipmentDto {
  @IsUUID()
  orderId!: string;

  @IsUUID()
  carrierId!: string;

  @IsString()
  @Length(1, 100)
  service!: string;
}
