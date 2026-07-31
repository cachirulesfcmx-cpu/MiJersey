import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import type { TicketMessageEntity } from '../../domain/entities/ticket-message.entity';
import { TicketClosedError, TicketNotFoundError } from '../../domain/errors/support.errors';
import type { TicketRepositoryPort } from '../../domain/ports/ticket.repository.port';
import type { TicketMessageRepositoryPort } from '../../domain/ports/ticket-message.repository.port';
import { TicketMessageAuthorType, TicketStatus } from '../../domain/value-objects/support-enums';
import { TICKET_MESSAGE_REPOSITORY, TICKET_REPOSITORY } from '../../support.constants';

export interface ReplyToTicketInput {
  ticketId: string;
  /** `null` cuando responde un agente/admin. */
  customerId: string | null;
  authorType: TicketMessageAuthorType;
  authorId: string | null;
  message: string;
  attachments: string[];
  isInternal: boolean;
  ipAddress: string | null;
}

/** Spec §4 "Las respuestas deberán actualizar el estado cuando corresponda": una respuesta del agente marca `firstRespondedAt` (si es la primera) y mueve `OPEN → IN_PROGRESS`; si no es una nota interna, además pasa a `WAITING_CUSTOMER` (se espera al cliente). Una respuesta del cliente saca al ticket de `WAITING_CUSTOMER`/`RESOLVED` de vuelta a `IN_PROGRESS`. Un ticket `CLOSED` no admite nuevas respuestas — hay que reabrirlo explícitamente vía `PATCH /admin/support/tickets/:id`. */
@Injectable()
export class ReplyToTicketUseCase {
  constructor(
    @Inject(TICKET_REPOSITORY) private readonly tickets: TicketRepositoryPort,
    @Inject(TICKET_MESSAGE_REPOSITORY) private readonly messages: TicketMessageRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: ReplyToTicketInput): Promise<TicketMessageEntity> {
    const ticket = await this.tickets.findById(input.ticketId);
    if (!ticket || (input.customerId !== null && ticket.customerId !== input.customerId)) {
      throw new TicketNotFoundError();
    }
    if (ticket.status === TicketStatus.CLOSED) {
      throw new TicketClosedError();
    }

    const message = await this.messages.create({
      ticketId: input.ticketId,
      authorType: input.authorType,
      authorId: input.authorId,
      message: input.message,
      attachments: input.attachments,
      isInternal: input.isInternal,
    });

    if (input.authorType === TicketMessageAuthorType.AGENT) {
      const nextStatus = input.isInternal
        ? ticket.status === TicketStatus.OPEN
          ? TicketStatus.IN_PROGRESS
          : ticket.status
        : TicketStatus.WAITING_CUSTOMER;
      await this.tickets.update(input.ticketId, {
        ...(ticket.firstRespondedAt === null ? { firstRespondedAt: new Date() } : {}),
        status: nextStatus,
      });
    } else if (
      input.authorType === TicketMessageAuthorType.CUSTOMER &&
      (ticket.status === TicketStatus.WAITING_CUSTOMER || ticket.status === TicketStatus.RESOLVED)
    ) {
      await this.tickets.update(input.ticketId, { status: TicketStatus.IN_PROGRESS });
    }

    await this.auditLog.record({
      userId: input.authorId,
      action: 'support.ticket.replied',
      ipAddress: input.ipAddress,
      metadata: {
        ticketId: input.ticketId,
        authorType: input.authorType,
        isInternal: input.isInternal,
      },
    });

    return message;
  }
}
