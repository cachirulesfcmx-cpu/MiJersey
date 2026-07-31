import type { PaginatedResult } from '@mijersey/shared-types';
import { Injectable } from '@nestjs/common';
import type { TicketMessage as PrismaTicketMessage } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { TicketMessageEntity } from '../../domain/entities/ticket-message.entity';
import type {
  CreateTicketMessageData,
  ListTicketMessagesParams,
  TicketMessageRepositoryPort,
} from '../../domain/ports/ticket-message.repository.port';
import type { TicketMessageAuthorType } from '../../domain/value-objects/support-enums';

function toEntity(row: PrismaTicketMessage): TicketMessageEntity {
  return new TicketMessageEntity({
    id: row.id,
    ticketId: row.ticketId,
    authorType: row.authorType as TicketMessageAuthorType,
    authorId: row.authorId,
    message: row.message,
    attachments: row.attachments,
    isInternal: row.isInternal,
    createdAt: row.createdAt,
  });
}

@Injectable()
export class PrismaTicketMessageRepository implements TicketMessageRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateTicketMessageData): Promise<TicketMessageEntity> {
    const row = await this.prisma.ticketMessage.create({ data });
    return toEntity(row);
  }

  async findMany(params: ListTicketMessagesParams): Promise<PaginatedResult<TicketMessageEntity>> {
    const skip = (params.page - 1) * params.pageSize;
    const where = {
      ticketId: params.ticketId,
      ...(params.includeInternal ? {} : { isInternal: false }),
    };

    const [rows, total] = await Promise.all([
      this.prisma.ticketMessage.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip,
        take: params.pageSize,
      }),
      this.prisma.ticketMessage.count({ where }),
    ]);

    return {
      items: rows.map(toEntity),
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
    };
  }
}
