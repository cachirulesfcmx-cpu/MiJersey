import { Inject, Injectable } from '@nestjs/common';

import type { TicketEntity } from '../../domain/entities/ticket.entity';
import { TicketNotFoundError } from '../../domain/errors/support.errors';
import type { TicketRepositoryPort } from '../../domain/ports/ticket.repository.port';
import { TICKET_REPOSITORY } from '../../support.constants';

export interface GetTicketInput {
  id: string;
  /** `null` cuando lo consulta un agente/admin (`admin:access`), que puede ver cualquier ticket. */
  customerId: string | null;
}

/** 404 (no 403) cuando el ticket es de otro cliente — no revela que el recurso existe, mismo criterio que `GetOrderUseCase` (021). */
@Injectable()
export class GetTicketUseCase {
  constructor(@Inject(TICKET_REPOSITORY) private readonly tickets: TicketRepositoryPort) {}

  async execute(input: GetTicketInput): Promise<TicketEntity> {
    const ticket = await this.tickets.findById(input.id);
    if (!ticket || (input.customerId !== null && ticket.customerId !== input.customerId)) {
      throw new TicketNotFoundError();
    }
    return ticket;
  }
}
