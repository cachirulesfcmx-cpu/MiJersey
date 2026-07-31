import { IsEnum, IsOptional, IsUUID } from 'class-validator';

import { TicketPriority, TicketStatus } from '../../domain/value-objects/support-enums';

export class UpdateTicketDto {
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @IsOptional()
  @IsUUID()
  assignedAgentId?: string | null;
}
