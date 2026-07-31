import { Injectable } from '@nestjs/common';
import type { OrderStatusHistory as PrismaOrderStatusHistory } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { OrderStatusHistoryEntity } from '../../domain/entities/order-status-history.entity';
import type {
  CreateOrderStatusHistoryData,
  OrderStatusHistoryRepositoryPort,
} from '../../domain/ports/order-status-history.repository.port';

function toEntity(row: PrismaOrderStatusHistory): OrderStatusHistoryEntity {
  return new OrderStatusHistoryEntity({
    id: row.id,
    orderId: row.orderId,
    field: row.field,
    value: row.value,
    note: row.note,
    createdAt: row.createdAt,
  });
}

@Injectable()
export class PrismaOrderStatusHistoryRepository implements OrderStatusHistoryRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByOrderId(orderId: string): Promise<OrderStatusHistoryEntity[]> {
    const rows = await this.prisma.orderStatusHistory.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(toEntity);
  }

  async create(data: CreateOrderStatusHistoryData): Promise<OrderStatusHistoryEntity> {
    const row = await this.prisma.orderStatusHistory.create({
      data: {
        orderId: data.orderId,
        field: data.field,
        value: data.value,
        note: data.note ?? null,
      },
    });
    return toEntity(row);
  }
}
