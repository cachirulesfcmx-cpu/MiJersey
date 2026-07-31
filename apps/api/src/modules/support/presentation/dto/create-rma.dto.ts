import { IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class CreateRmaDto {
  @IsUUID()
  orderId!: string;

  @IsOptional()
  @IsUUID()
  ticketId?: string;

  @IsString()
  @Length(1, 1000)
  reason!: string;

  @IsString()
  @Length(1, 2000)
  itemsDescription!: string;
}
