import type { PaginatedResult, PaginationParams } from '@mijersey/shared-types';

import type { TicketMessageEntity } from '../entities/ticket-message.entity';
import type { TicketMessageAuthorType } from '../value-objects/support-enums';

export interface CreateTicketMessageData {
  ticketId: string;
  authorType: TicketMessageAuthorType;
  authorId: string | null;
  message: string;
  attachments: string[];
  isInternal: boolean;
}

export interface ListTicketMessagesParams extends PaginationParams {
  ticketId: string;
  /** Cuando es `false`, excluye mensajes `isInternal` — el cliente nunca los ve (spec §4). */
  includeInternal: boolean;
}

export interface TicketMessageRepositoryPort {
  create(data: CreateTicketMessageData): Promise<TicketMessageEntity>;
  findMany(params: ListTicketMessagesParams): Promise<PaginatedResult<TicketMessageEntity>>;
}
