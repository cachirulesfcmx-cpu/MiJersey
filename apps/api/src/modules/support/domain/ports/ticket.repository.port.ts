import type { PaginatedResult, PaginationParams } from '@mijersey/shared-types';

import type { TicketEntity } from '../entities/ticket.entity';
import type { TicketCategory, TicketPriority, TicketStatus } from '../value-objects/support-enums';

export interface CreateTicketData {
  ticketNumber: string;
  customerId: string;
  orderId: string | null;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  firstResponseDueAt: Date;
  resolutionDueAt: Date;
}

export interface UpdateTicketData {
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedAgentId?: string | null;
  firstRespondedAt?: Date;
  closedAt?: Date | null;
}

export interface ListTicketsParams extends PaginationParams {
  customerId?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedAgentId?: string;
}

export interface TicketRepositoryPort {
  findById(id: string): Promise<TicketEntity | null>;
  findMany(params: ListTicketsParams): Promise<PaginatedResult<TicketEntity>>;
  create(data: CreateTicketData): Promise<TicketEntity>;
  update(id: string, data: UpdateTicketData): Promise<TicketEntity>;
}
