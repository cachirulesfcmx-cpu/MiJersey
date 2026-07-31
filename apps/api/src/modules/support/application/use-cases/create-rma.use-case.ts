import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { GetOrderUseCase } from '../../../orders/application/use-cases/get-order.use-case';
import type { RmaRequestEntity } from '../../domain/entities/rma-request.entity';
import { OrderNotFoundError, TicketNotFoundError } from '../../domain/errors/support.errors';
import type { RmaRequestRepositoryPort } from '../../domain/ports/rma-request.repository.port';
import type { TicketRepositoryPort } from '../../domain/ports/ticket.repository.port';
import { calculateSlaDueDates } from '../../domain/value-objects/sla.util';
import { TicketCategory, TicketPriority } from '../../domain/value-objects/support-enums';
import {
  generateRmaNumber,
  generateTicketNumber,
} from '../../domain/value-objects/support-number.util';
import { RMA_REPOSITORY, TICKET_REPOSITORY } from '../../support.constants';

export interface CreateRmaInput {
  customerId: string;
  orderId: string;
  reason: string;
  itemsDescription: string;
  ticketId?: string | null;
  ipAddress: string | null;
}

/** RMA preparada (spec §2/§4): valida la propiedad del pedido reutilizando `GetOrderUseCase` (021). Si no se referencia un ticket existente, crea uno de categoría `RETURN_REFUND` para mantener la trazabilidad completa exigida por la spec — la devolución nunca queda huérfana de un historial. No genera un envío de retorno real en Shipping (023): eso es una integración "preparada", no ejecutada, en este sprint. */
@Injectable()
export class CreateRmaUseCase {
  constructor(
    @Inject(RMA_REPOSITORY) private readonly rmaRequests: RmaRequestRepositoryPort,
    @Inject(TICKET_REPOSITORY) private readonly tickets: TicketRepositoryPort,
    private readonly getOrder: GetOrderUseCase,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: CreateRmaInput): Promise<RmaRequestEntity> {
    try {
      await this.getOrder.execute({ id: input.orderId, customerId: input.customerId });
    } catch {
      throw new OrderNotFoundError();
    }

    let ticketId = input.ticketId ?? null;
    if (ticketId) {
      const ticket = await this.tickets.findById(ticketId);
      if (!ticket || ticket.customerId !== input.customerId) throw new TicketNotFoundError();
    } else {
      const createdAt = new Date();
      const { firstResponseDueAt, resolutionDueAt } = calculateSlaDueDates(
        TicketPriority.MEDIUM,
        createdAt,
      );
      const ticket = await this.tickets.create({
        ticketNumber: generateTicketNumber(),
        customerId: input.customerId,
        orderId: input.orderId,
        subject: `Solicitud de devolución — pedido ${input.orderId}`,
        category: TicketCategory.RETURN_REFUND,
        priority: TicketPriority.MEDIUM,
        firstResponseDueAt,
        resolutionDueAt,
      });
      ticketId = ticket.id;
    }

    const rma = await this.rmaRequests.create({
      rmaNumber: generateRmaNumber(),
      ticketId,
      orderId: input.orderId,
      customerId: input.customerId,
      reason: input.reason,
      itemsDescription: input.itemsDescription,
    });

    await this.auditLog.record({
      userId: input.customerId,
      action: 'support.rma.requested',
      ipAddress: input.ipAddress,
      metadata: { rmaId: rma.id, orderId: input.orderId, ticketId },
    });

    return rma;
  }
}
