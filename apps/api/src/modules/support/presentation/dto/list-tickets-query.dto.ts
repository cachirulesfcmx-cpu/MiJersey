import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

import { TicketPriority, TicketStatus } from '../../domain/value-objects/support-enums';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export class ListTicketsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  pageSize: number = DEFAULT_PAGE_SIZE;

  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  /** Solo aplicable en `/admin/support/tickets` — ignorado en el endpoint de cliente. */
  @IsOptional()
  @IsUUID()
  assignedAgentId?: string;
}
