import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { GetOrderUseCase } from '../../../orders/application/use-cases/get-order.use-case';
import type { TicketEntity } from '../../domain/entities/ticket.entity';
import { OrderNotFoundError } from '../../domain/errors/support.errors';
import type { TicketRepositoryPort } from '../../domain/ports/ticket.repository.port';
import { calculateSlaDueDates } from '../../domain/value-objects/sla.util';
import { TicketCategory, TicketPriority } from '../../domain/value-objects/support-enums';
import { generateTicketNumber } from '../../domain/value-objects/support-number.util';
import { TICKET_REPOSITORY } from '../../support.constants';

export interface CreateTicketInput {
  customerId: string;
  orderId?: string | null;
  subject: string;
  category: TicketCategory;
  priority?: TicketPriority;
  ipAddress: string | null;
}

/** Si se referencia un pedido, se valida su propiedad reutilizando `GetOrderUseCase` (021) — mismo patrón cross-módulo de traducción de errores que Shipping/Payments: el `OrderNotFoundError` de Orders se relanza como el propio de Support. */
@Injectable()
export class CreateTicketUseCase {
  constructor(
    @Inject(TICKET_REPOSITORY) private readonly tickets: TicketRepositoryPort,
    private readonly getOrder: GetOrderUseCase,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: CreateTicketInput): Promise<TicketEntity> {
    if (input.orderId) {
      try {
        await this.getOrder.execute({ id: input.orderId, customerId: input.customerId });
      } catch {
        throw new OrderNotFoundError();
      }
    }

    const priority = input.priority ?? TicketPriority.MEDIUM;
    const createdAt = new Date();
    const { firstResponseDueAt, resolutionDueAt } = calculateSlaDueDates(priority, createdAt);

    const ticket = await this.tickets.create({
      ticketNumber: generateTicketNumber(),
      customerId: input.customerId,
      orderId: input.orderId ?? null,
      subject: input.subject,
      category: input.category,
      priority,
      firstResponseDueAt,
      resolutionDueAt,
    });

    await this.auditLog.record({
      userId: input.customerId,
      action: 'support.ticket.created',
      ipAddress: input.ipAddress,
      metadata: { ticketId: ticket.id, category: input.category, priority },
    });

    return ticket;
  }
}
