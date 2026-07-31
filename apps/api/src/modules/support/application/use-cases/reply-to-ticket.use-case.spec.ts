import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { TicketEntity } from '../../domain/entities/ticket.entity';
import { TicketMessageEntity } from '../../domain/entities/ticket-message.entity';
import { TicketClosedError, TicketNotFoundError } from '../../domain/errors/support.errors';
import type { TicketRepositoryPort } from '../../domain/ports/ticket.repository.port';
import type { TicketMessageRepositoryPort } from '../../domain/ports/ticket-message.repository.port';
import {
  TicketCategory,
  TicketMessageAuthorType,
  TicketPriority,
  TicketStatus,
} from '../../domain/value-objects/support-enums';
import { ReplyToTicketUseCase } from './reply-to-ticket.use-case';

function buildTicket(
  overrides: Partial<{
    status: TicketStatus;
    firstRespondedAt: Date | null;
    customerId: string;
  }> = {},
): TicketEntity {
  return new TicketEntity({
    id: 'ticket-1',
    ticketNumber: 'TCK-1',
    customerId: overrides.customerId ?? 'customer-1',
    orderId: null,
    subject: 'Help',
    category: TicketCategory.GENERAL,
    priority: TicketPriority.MEDIUM,
    status: overrides.status ?? TicketStatus.OPEN,
    assignedAgentId: null,
    firstResponseDueAt: new Date(),
    resolutionDueAt: new Date(),
    firstRespondedAt: overrides.firstRespondedAt ?? null,
    closedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildMessage(): TicketMessageEntity {
  return new TicketMessageEntity({
    id: 'message-1',
    ticketId: 'ticket-1',
    authorType: TicketMessageAuthorType.AGENT,
    authorId: 'agent-1',
    message: 'hi',
    attachments: [],
    isInternal: false,
    createdAt: new Date(),
  });
}

function buildUseCase(ticket: TicketEntity | null = buildTicket()) {
  const tickets: jest.Mocked<TicketRepositoryPort> = {
    findById: jest.fn().mockResolvedValue(ticket),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn().mockResolvedValue(ticket),
  };
  const messages: jest.Mocked<TicketMessageRepositoryPort> = {
    create: jest.fn().mockResolvedValue(buildMessage()),
    findMany: jest.fn(),
  };
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  return {
    useCase: new ReplyToTicketUseCase(tickets, messages, auditLog),
    tickets,
    messages,
    auditLog,
  };
}

describe('ReplyToTicketUseCase', () => {
  it('throws TicketNotFoundError when the ticket belongs to another customer', async () => {
    const { useCase } = buildUseCase(buildTicket({ customerId: 'someone-else' }));

    await expect(
      useCase.execute({
        ticketId: 'ticket-1',
        customerId: 'customer-1',
        authorType: TicketMessageAuthorType.CUSTOMER,
        authorId: 'customer-1',
        message: 'hi',
        attachments: [],
        isInternal: false,
        ipAddress: null,
      }),
    ).rejects.toThrow(TicketNotFoundError);
  });

  it('throws TicketClosedError when the ticket is closed', async () => {
    const { useCase } = buildUseCase(buildTicket({ status: TicketStatus.CLOSED }));

    await expect(
      useCase.execute({
        ticketId: 'ticket-1',
        customerId: 'customer-1',
        authorType: TicketMessageAuthorType.CUSTOMER,
        authorId: 'customer-1',
        message: 'hi',
        attachments: [],
        isInternal: false,
        ipAddress: null,
      }),
    ).rejects.toThrow(TicketClosedError);
  });

  it('moves the ticket to WAITING_CUSTOMER on a public agent reply and records firstRespondedAt', async () => {
    const { useCase, tickets } = buildUseCase(buildTicket({ status: TicketStatus.OPEN }));

    await useCase.execute({
      ticketId: 'ticket-1',
      customerId: null,
      authorType: TicketMessageAuthorType.AGENT,
      authorId: 'agent-1',
      message: 'hi',
      attachments: [],
      isInternal: false,
      ipAddress: null,
    });

    expect(tickets.update).toHaveBeenCalledWith(
      'ticket-1',
      expect.objectContaining({
        status: TicketStatus.WAITING_CUSTOMER,
        firstRespondedAt: expect.any(Date),
      }),
    );
  });

  it('moves OPEN to IN_PROGRESS on an internal agent note without waiting on the customer', async () => {
    const { useCase, tickets } = buildUseCase(buildTicket({ status: TicketStatus.OPEN }));

    await useCase.execute({
      ticketId: 'ticket-1',
      customerId: null,
      authorType: TicketMessageAuthorType.AGENT,
      authorId: 'agent-1',
      message: 'internal note',
      attachments: [],
      isInternal: true,
      ipAddress: null,
    });

    expect(tickets.update).toHaveBeenCalledWith(
      'ticket-1',
      expect.objectContaining({ status: TicketStatus.IN_PROGRESS }),
    );
  });

  it('does not overwrite firstRespondedAt once it is already set', async () => {
    const { useCase, tickets } = buildUseCase(
      buildTicket({
        status: TicketStatus.WAITING_CUSTOMER,
        firstRespondedAt: new Date('2026-01-01'),
      }),
    );

    await useCase.execute({
      ticketId: 'ticket-1',
      customerId: null,
      authorType: TicketMessageAuthorType.AGENT,
      authorId: 'agent-1',
      message: 'hi again',
      attachments: [],
      isInternal: false,
      ipAddress: null,
    });

    expect(tickets.update).toHaveBeenCalledWith(
      'ticket-1',
      expect.not.objectContaining({ firstRespondedAt: expect.anything() }),
    );
  });

  it('moves a WAITING_CUSTOMER ticket back to IN_PROGRESS when the customer replies', async () => {
    const { useCase, tickets } = buildUseCase(
      buildTicket({ status: TicketStatus.WAITING_CUSTOMER }),
    );

    await useCase.execute({
      ticketId: 'ticket-1',
      customerId: 'customer-1',
      authorType: TicketMessageAuthorType.CUSTOMER,
      authorId: 'customer-1',
      message: 'still broken',
      attachments: [],
      isInternal: false,
      ipAddress: null,
    });

    expect(tickets.update).toHaveBeenCalledWith('ticket-1', { status: TicketStatus.IN_PROGRESS });
  });

  it('does not touch the ticket status when a customer replies to an already-open ticket', async () => {
    const { useCase, tickets } = buildUseCase(buildTicket({ status: TicketStatus.OPEN }));

    await useCase.execute({
      ticketId: 'ticket-1',
      customerId: 'customer-1',
      authorType: TicketMessageAuthorType.CUSTOMER,
      authorId: 'customer-1',
      message: 'more info',
      attachments: [],
      isInternal: false,
      ipAddress: null,
    });

    expect(tickets.update).not.toHaveBeenCalled();
  });
});
