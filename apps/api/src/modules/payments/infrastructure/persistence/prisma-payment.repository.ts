import type { PaginatedResult, PaginationParams } from '@mijersey/shared-types';
import { Injectable } from '@nestjs/common';
import type { Payment as PrismaPayment } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { PaymentEntity } from '../../domain/entities/payment.entity';
import type {
  CreatePaymentData,
  PaymentRepositoryPort,
  PaymentSummaryView,
  UpdatePaymentStatusData,
} from '../../domain/ports/payment.repository.port';
import type { PaymentTransactionStatus } from '../../domain/value-objects/payment-status';

function toEntity(row: PrismaPayment): PaymentEntity {
  return new PaymentEntity({
    id: row.id,
    orderId: row.orderId,
    provider: row.provider,
    transactionId: row.transactionId,
    amount: row.amount.toNumber(),
    currency: row.currency,
    status: row.status as PaymentTransactionStatus,
    authorizedAt: row.authorizedAt,
    capturedAt: row.capturedAt,
    refundedAt: row.refundedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

function toSummaryView(row: PrismaPayment): PaymentSummaryView {
  return {
    id: row.id,
    orderId: row.orderId,
    provider: row.provider,
    transactionId: row.transactionId,
    amount: row.amount.toNumber(),
    currency: row.currency,
    status: row.status,
    refundedAt: row.refundedAt,
    createdAt: row.createdAt,
  };
}

@Injectable()
export class PrismaPaymentRepository implements PaymentRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<PaymentEntity | null> {
    const row = await this.prisma.payment.findUnique({ where: { id } });
    return row ? toEntity(row) : null;
  }

  async findByOrderId(orderId: string): Promise<PaymentEntity[]> {
    const rows = await this.prisma.payment.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toEntity);
  }

  async findByProviderTransactionId(
    provider: string,
    transactionId: string,
  ): Promise<PaymentEntity | null> {
    const row = await this.prisma.payment.findUnique({
      where: { provider_transactionId: { provider, transactionId } },
    });
    return row ? toEntity(row) : null;
  }

  async create(data: CreatePaymentData): Promise<PaymentEntity> {
    const row = await this.prisma.payment.create({
      data: {
        orderId: data.orderId,
        provider: data.provider,
        transactionId: data.transactionId,
        amount: data.amount,
        currency: data.currency,
        status: data.status,
        authorizedAt: data.status === 'AUTHORIZED' ? new Date() : null,
      },
    });
    return toEntity(row);
  }

  async updateStatus(id: string, patch: UpdatePaymentStatusData): Promise<PaymentEntity> {
    const row = await this.prisma.payment.update({
      where: { id },
      data: {
        status: patch.status,
        ...(patch.authorizedAt !== undefined ? { authorizedAt: patch.authorizedAt } : {}),
        ...(patch.capturedAt !== undefined ? { capturedAt: patch.capturedAt } : {}),
        ...(patch.refundedAt !== undefined ? { refundedAt: patch.refundedAt } : {}),
      },
    });
    return toEntity(row);
  }

  async findRefunded(params: PaginationParams): Promise<PaginatedResult<PaymentSummaryView>> {
    const skip = (params.page - 1) * params.pageSize;
    const where = {
      status: { in: ['REFUNDED', 'PARTIALLY_REFUNDED'] as PaymentTransactionStatus[] },
    };

    const [rows, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        orderBy: { refundedAt: 'desc' },
        skip,
        take: params.pageSize,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      items: rows.map(toSummaryView),
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
    };
  }
}
