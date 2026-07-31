import type { PaginatedResult } from '@mijersey/shared-types';
import { Inject, Injectable } from '@nestjs/common';

import type { TicketEntity } from '../../domain/entities/ticket.entity';
import type {
  ListTicketsParams,
  TicketRepositoryPort,
} from '../../domain/ports/ticket.repository.port';
import { TICKET_REPOSITORY } from '../../support.constants';

@Injectable()
export class ListTicketsUseCase {
  constructor(@Inject(TICKET_REPOSITORY) private readonly tickets: TicketRepositoryPort) {}

  async execute(params: ListTicketsParams): Promise<PaginatedResult<TicketEntity>> {
    return this.tickets.findMany(params);
  }
}
