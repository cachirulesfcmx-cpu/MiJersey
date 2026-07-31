import type { PaginatedResult } from '@mijersey/shared-types';
import { Injectable } from '@nestjs/common';
import type { RmaRequest as PrismaRmaRequest } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { RmaRequestEntity } from '../../domain/entities/rma-request.entity';
import type {
  CreateRmaData,
  ListRmaParams,
  RmaRequestRepositoryPort,
} from '../../domain/ports/rma-request.repository.port';
import type { RmaStatus } from '../../domain/value-objects/support-enums';

function toEntity(row: PrismaRmaRequest): RmaRequestEntity {
  return new RmaRequestEntity({
    id: row.id,
    rmaNumber: row.rmaNumber,
    ticketId: row.ticketId,
    orderId: row.orderId,
    customerId: row.customerId,
    reason: row.reason,
    itemsDescription: row.itemsDescription,
    status: row.status as RmaStatus,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

@Injectable()
export class PrismaRmaRequestRepository implements RmaRequestRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<RmaRequestEntity | null> {
    const row = await this.prisma.rmaRequest.findUnique({ where: { id } });
    return row ? toEntity(row) : null;
  }

  async findMany(params: ListRmaParams): Promise<PaginatedResult<RmaRequestEntity>> {
    const skip = (params.page - 1) * params.pageSize;
    const where = {
      ...(params.customerId !== undefined ? { customerId: params.customerId } : {}),
      ...(params.status !== undefined ? { status: params.status } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.rmaRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: params.pageSize,
      }),
      this.prisma.rmaRequest.count({ where }),
    ]);

    return {
      items: rows.map(toEntity),
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
    };
  }

  async create(data: CreateRmaData): Promise<RmaRequestEntity> {
    const row = await this.prisma.rmaRequest.create({ data });
    return toEntity(row);
  }

  async updateStatus(id: string, status: RmaStatus): Promise<RmaRequestEntity> {
    const row = await this.prisma.rmaRequest.update({ where: { id }, data: { status } });
    return toEntity(row);
  }
}
