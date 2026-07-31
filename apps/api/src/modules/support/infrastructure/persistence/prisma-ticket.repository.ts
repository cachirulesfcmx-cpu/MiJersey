import type { PaginatedResult } from '@mijersey/shared-types';
import { Injectable } from '@nestjs/common';
import type { Ticket as PrismaTicket } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { TicketEntity } from '../../domain/entities/ticket.entity';
import type {
  CreateTicketData,
  ListTicketsParams,
  TicketRepositoryPort,
  UpdateTicketData,
} from '../../domain/ports/ticket.repository.port';
import type {
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from '../../domain/value-objects/support-enums';

function toEntity(row: PrismaTicket): TicketEntity {
  return new TicketEntity({
    id: row.id,
    ticketNumber: row.ticketNumber,
    customerId: row.customerId,
    orderId: row.orderId,
    subject: row.subject,
    category: row.category as TicketCategory,
    priority: row.priority as TicketPriority,
    status: row.status as TicketStatus,
    assignedAgentId: row.assignedAgentId,
    firstResponseDueAt: row.firstResponseDueAt,
    resolutionDueAt: row.resolutionDueAt,
    firstRespondedAt: row.firstRespondedAt,
    closedAt: row.closedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

@Injectable()
export class PrismaTicketRepository implements TicketRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<TicketEntity | null> {
    const row = await this.prisma.ticket.findUnique({ where: { id } });
    return row ? toEntity(row) : null;
  }

  async findMany(params: ListTicketsParams): Promise<PaginatedResult<TicketEntity>> {
    const skip = (params.page - 1) * params.pageSize;
    const where = {
      ...(params.customerId !== undefined ? { customerId: params.customerId } : {}),
      ...(params.status !== undefined ? { status: params.status } : {}),
      ...(params.priority !== undefined ? { priority: params.priority } : {}),
      ...(params.assignedAgentId !== undefined ? { assignedAgentId: params.assignedAgentId } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: params.pageSize,
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return {
      items: rows.map(toEntity),
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
    };
  }

  async create(data: CreateTicketData): Promise<TicketEntity> {
    const row = await this.prisma.ticket.create({ data });
    return toEntity(row);
  }

  async update(id: string, data: UpdateTicketData): Promise<TicketEntity> {
    const row = await this.prisma.ticket.update({ where: { id }, data });
    return toEntity(row);
  }
}
