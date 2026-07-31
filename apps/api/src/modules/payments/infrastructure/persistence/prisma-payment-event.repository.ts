import { Injectable } from '@nestjs/common';
import type { PaymentEvent as PrismaPaymentEvent, Prisma } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { PaymentEventEntity } from '../../domain/entities/payment-event.entity';
import type {
  CreatePaymentEventData,
  PaymentEventRepositoryPort,
} from '../../domain/ports/payment-event.repository.port';

function toEntity(row: PrismaPaymentEvent): PaymentEventEntity {
  return new PaymentEventEntity({
    id: row.id,
    paymentId: row.paymentId,
    eventType: row.eventType,
    payload: row.payload as Record<string, unknown>,
    processedAt: row.processedAt,
  });
}

@Injectable()
export class PrismaPaymentEventRepository implements PaymentEventRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByPaymentId(paymentId: string): Promise<PaymentEventEntity[]> {
    const rows = await this.prisma.paymentEvent.findMany({
      where: { paymentId },
      orderBy: { processedAt: 'asc' },
    });
    return rows.map(toEntity);
  }

  async create(data: CreatePaymentEventData): Promise<PaymentEventEntity> {
    const row = await this.prisma.paymentEvent.create({
      data: {
        paymentId: data.paymentId,
        eventType: data.eventType,
        payload: data.payload as Prisma.InputJsonValue,
      },
    });
    return toEntity(row);
  }
}
