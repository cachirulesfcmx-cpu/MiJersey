import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import type { GetOrderUseCase } from '../../../orders/application/use-cases/get-order.use-case';
import { RmaRequestEntity } from '../../domain/entities/rma-request.entity';
import { TicketEntity } from '../../domain/entities/ticket.entity';
import { OrderNotFoundError, TicketNotFoundError } from '../../domain/errors/support.errors';
import type { RmaRequestRepositoryPort } from '../../domain/ports/rma-request.repository.port';
import type { TicketRepositoryPort } from '../../domain/ports/ticket.repository.port';
import {
  RmaStatus,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from '../../domain/value-objects/support-enums';
import { CreateRmaUseCase } from './create-rma.use-case';

function buildTicket(): TicketEntity {
  return new TicketEntity({
    id: 'ticket-existing',
    ticketNumber: 'TCK-1',
    customerId: 'customer-1',
    orderId: 'order-1',
    subject: 'Existing ticket',
    category: TicketCategory.RETURN_REFUND,
    priority: TicketPriority.MEDIUM,
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

function buildRma(): RmaRequestEntity {
  return new RmaRequestEntity({
    id: 'rma-1',
    rmaNumber: 'RMA-1',
    ticketId: 'ticket-1',
    orderId: 'order-1',
    customerId: 'customer-1',
    reason: 'defective',
    itemsDescription: '1 jersey',
    status: RmaStatus.REQUESTED,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildUseCase(
  options: { orderExists?: boolean; existingTicket?: TicketEntity | null } = {},
) {
  const rmaRequests: jest.Mocked<RmaRequestRepositoryPort> = {
    findById: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn().mockResolvedValue(buildRma()),
    updateStatus: jest.fn(),
  };
  const tickets: jest.Mocked<TicketRepositoryPort> = {
    findById: jest
      .fn()
      .mockResolvedValue(
        options.existingTicket === undefined ? buildTicket() : options.existingTicket,
      ),
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
    useCase: new CreateRmaUseCase(rmaRequests, tickets, getOrder, auditLog),
    rmaRequests,
    tickets,
    getOrder,
    auditLog,
  };
}

describe('CreateRmaUseCase', () => {
  it("throws OrderNotFoundError when the order is not the customer's own", async () => {
    const { useCase } = buildUseCase({ orderExists: false });

    await expect(
      useCase.execute({
        customerId: 'customer-1',
        orderId: 'order-1',
        reason: 'defective',
        itemsDescription: '1 jersey',
        ipAddress: null,
      }),
    ).rejects.toThrow(OrderNotFoundError);
  });

  it('creates a new RETURN_REFUND ticket when no ticketId is given', async () => {
    const { useCase, tickets, rmaRequests } = buildUseCase();

    await useCase.execute({
      customerId: 'customer-1',
      orderId: 'order-1',
      reason: 'defective',
      itemsDescription: '1 jersey',
      ipAddress: null,
    });

    expect(tickets.create).toHaveBeenCalledWith(
      expect.objectContaining({ category: TicketCategory.RETURN_REFUND, orderId: 'order-1' }),
    );
    expect(rmaRequests.create).toHaveBeenCalledWith(
      expect.objectContaining({ ticketId: 'ticket-existing', orderId: 'order-1' }),
    );
  });

  it('reuses an existing ticket when a ticketId is given', async () => {
    const { useCase, tickets, rmaRequests } = buildUseCase();

    await useCase.execute({
      customerId: 'customer-1',
      orderId: 'order-1',
      reason: 'defective',
      itemsDescription: '1 jersey',
      ticketId: 'ticket-existing',
      ipAddress: null,
    });

    expect(tickets.create).not.toHaveBeenCalled();
    expect(rmaRequests.create).toHaveBeenCalledWith(
      expect.objectContaining({ ticketId: 'ticket-existing' }),
    );
  });

  it("throws TicketNotFoundError when the referenced ticket is not the customer's own", async () => {
    const { useCase } = buildUseCase({ existingTicket: null });

    await expect(
      useCase.execute({
        customerId: 'customer-1',
        orderId: 'order-1',
        reason: 'defective',
        itemsDescription: '1 jersey',
        ticketId: 'ticket-existing',
        ipAddress: null,
      }),
    ).rejects.toThrow(TicketNotFoundError);
  });
});
