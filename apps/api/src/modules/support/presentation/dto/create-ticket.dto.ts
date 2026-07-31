import { IsEnum, IsOptional, IsString, IsUUID, Length } from 'class-validator';

import { TicketCategory, TicketPriority } from '../../domain/value-objects/support-enums';

export class CreateTicketDto {
  @IsOptional()
  @IsUUID()
  orderId?: string;

  @IsString()
  @Length(1, 200)
  subject!: string;

  @IsEnum(TicketCategory)
  category!: TicketCategory;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;
}
