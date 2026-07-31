import type { PaginatedResult, PaginationParams } from '@mijersey/shared-types';
import { Inject, Injectable } from '@nestjs/common';

import type { TicketMessageEntity } from '../../domain/entities/ticket-message.entity';
import { TicketNotFoundError } from '../../domain/errors/support.errors';
import type { TicketRepositoryPort } from '../../domain/ports/ticket.repository.port';
import type { TicketMessageRepositoryPort } from '../../domain/ports/ticket-message.repository.port';
import { TICKET_MESSAGE_REPOSITORY, TICKET_REPOSITORY } from '../../support.constants';

export interface ListTicketMessagesInput extends PaginationParams {
  ticketId: string;
  /** `null` para un agente/admin, que sí ve las notas internas. */
  customerId: string | null;
}

/** Carga diferida de la conversación (spec §8) — paginada y separada del detalle del ticket. Filtra `isInternal` para clientes (spec §4 "Solo usuarios autorizados podrán ver notas internas"). */
@Injectable()
export class ListTicketMessagesUseCase {
  constructor(
    @Inject(TICKET_REPOSITORY) private readonly tickets: TicketRepositoryPort,
    @Inject(TICKET_MESSAGE_REPOSITORY) private readonly messages: TicketMessageRepositoryPort,
  ) {}

  async execute(input: ListTicketMessagesInput): Promise<PaginatedResult<TicketMessageEntity>> {
    const ticket = await this.tickets.findById(input.ticketId);
    if (!ticket || (input.customerId !== null && ticket.customerId !== input.customerId)) {
      throw new TicketNotFoundError();
    }

    return this.messages.findMany({
      ticketId: input.ticketId,
      page: input.page,
      pageSize: input.pageSize,
      includeInternal: input.customerId === null,
    });
  }
}
