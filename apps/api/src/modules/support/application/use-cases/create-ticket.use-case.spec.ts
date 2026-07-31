import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import type { GetOrderUseCase } from '../../../orders/application/use-cases/get-order.use-case';
import { TicketEntity } from '../../domain/entities/ticket.entity';
import { OrderNotFoundError } from '../../domain/errors/support.errors';
import type { TicketRepositoryPort } from '../../domain/ports/ticket.repository.port';
import {
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from '../../domain/value-objects/support-enums';
import { CreateTicketUseCase } from './create-ticket.use-case';

function buildTicket(overrides: Partial<{ priority: TicketPriority }> = {}): TicketEntity {
  return new TicketEntity({
    id: 'ticket-1',
    ticketNumber: 'TCK-1',
    customerId: 'customer-1',
    orderId: null,
    subject: 'Help',
    category: TicketCategory.GENERAL,
    priority: overrides.priority ?? TicketPriority.MEDIUM,
    status: TicketStatus.OPEN,
    assignedAgentId: null,
    firstResponseDueAt: new Date(),
    resolutionDueAt: new Date(),
    firstRespondedAt: null,
    closedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildUseCase(options: { orderExists?: boolean } = {}) {
  const tickets: jest.Mocked<TicketRepositoryPort> = {
    findById: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn().mockResolvedValue(buildTicket()),
    update: jest.fn(),
  };
  const getOrder = {
    execute: jest.fn().mockImplementation(() => {
      if (options.orderExists === false) throw new Error('not found');
      return Promise.resolve({});
    }),
  } as unknown as jest.Mocked<GetOrderUseCase>;
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  return {
    useCase: new CreateTicketUseCase(tickets, getOrder, auditLog),
    tickets,
    getOrder,
    auditLog,
  };
}

describe('CreateTicketUseCase', () => {
  it('creates a ticket with SLA due dates computed from its priority', async () => {
    const { useCase, tickets } = buildUseCase();

    await useCase.execute({
      customerId: 'customer-1',
      subject: 'Help',
      category: TicketCategory.GENERAL,
      priority: TicketPriority.URGENT,
      ipAddress: '127.0.0.1',
    });

    expect(tickets.create).toHaveBeenCalledWith(
      expect.objectContaining({ priority: TicketPriority.URGENT }),
    );
    const call = tickets.create.mock.calls[0]![0];
    const gapHours =
      (call.resolutionDueAt.getTime() - call.firstResponseDueAt.getTime()) / (60 * 60 * 1000);
    expect(gapHours).toBe(3);
  });

  it('defaults to MEDIUM priority when none is given', async () => {
    const { useCase, tickets } = buildUseCase();

    await useCase.execute({
      customerId: 'customer-1',
      subject: 'Help',
      category: TicketCategory.GENERAL,
      ipAddress: null,
    });

    expect(tickets.create).toHaveBeenCalledWith(
      expect.objectContaining({ priority: TicketPriority.MEDIUM }),
    );
  });

  it('validates order ownership when an orderId is given', async () => {
    const { useCase, getOrder } = buildUseCase();

    await useCase.execute({
      customerId: 'customer-1',
      orderId: 'order-1',
      subject: 'Help',
      category: TicketCategory.ORDER_ISSUE,
      ipAddress: null,
    });

    expect(getOrder.execute).toHaveBeenCalledWith({ id: 'order-1', customerId: 'customer-1' });
  });

  it("throws OrderNotFoundError when the referenced order is not the customer's own", async () => {
    const { useCase } = buildUseCase({ orderExists: false });

    await expect(
      useCase.execute({
        customerId: 'customer-1',
        orderId: 'order-1',
        subject: 'Help',
        category: TicketCategory.ORDER_ISSUE,
        ipAddress: null,
      }),
    ).rejects.toThrow(OrderNotFoundError);
  });

  it('records an audit log entry on creation', async () => {
    const { useCase, auditLog } = buildUseCase();

    await useCase.execute({
      customerId: 'customer-1',
      subject: 'Help',
      category: TicketCategory.GENERAL,
      ipAddress: null,
    });

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'support.ticket.created' }),
    );
  });
});
