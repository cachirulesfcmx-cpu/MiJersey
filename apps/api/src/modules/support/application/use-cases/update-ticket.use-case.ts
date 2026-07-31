import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import type { TicketEntity } from '../../domain/entities/ticket.entity';
import { TicketNotFoundError } from '../../domain/errors/support.errors';
import type { TicketRepositoryPort } from '../../domain/ports/ticket.repository.port';
import type { TicketPriority, TicketStatus } from '../../domain/value-objects/support-enums';
import { TICKET_REPOSITORY } from '../../support.constants';

export interface UpdateTicketInput {
  id: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedAgentId?: string | null;
  actorUserId: string;
  ipAddress: string | null;
}

/** Solo agentes/admin (`admin:access`) llegan aquí — spec §5/§6, gestión de estados y asignación. `closedAt` se fija al pasar a `CLOSED` y se limpia si el ticket se reabre a cualquier otro estado. */
@Injectable()
export class UpdateTicketUseCase {
  constructor(
    @Inject(TICKET_REPOSITORY) private readonly tickets: TicketRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: UpdateTicketInput): Promise<TicketEntity> {
    const existing = await this.tickets.findById(input.id);
    if (!existing) throw new TicketNotFoundError();

    const updated = await this.tickets.update(input.id, {
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
      ...(input.assignedAgentId !== undefined ? { assignedAgentId: input.assignedAgentId } : {}),
      ...(input.status === 'CLOSED' ? { closedAt: new Date() } : {}),
      ...(input.status !== undefined && input.status !== 'CLOSED' ? { closedAt: null } : {}),
    });

    if (input.status !== undefined && input.status !== existing.status) {
      await this.auditLog.record({
        userId: input.actorUserId,
        action:
          input.status === 'CLOSED' ? 'support.ticket.closed' : 'support.ticket.status_changed',
        ipAddress: input.ipAddress,
        metadata: { ticketId: input.id, from: existing.status, to: input.status },
      });
    }
    if (
      input.assignedAgentId !== undefined &&
      input.assignedAgentId !== existing.toJSON().assignedAgentId
    ) {
      await this.auditLog.record({
        userId: input.actorUserId,
        action: 'support.ticket.assigned',
        ipAddress: input.ipAddress,
        metadata: { ticketId: input.id, assignedAgentId: input.assignedAgentId },
      });
    }

    return updated;
  }
}
