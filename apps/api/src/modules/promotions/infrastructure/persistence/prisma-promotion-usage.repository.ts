import type { PaginatedResult, PaginationParams } from '@mijersey/shared-types';
import { Injectable } from '@nestjs/common';
import type { PromotionUsage as PrismaPromotionUsage } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { PromotionUsageEntity } from '../../domain/entities/promotion-usage.entity';
import type {
  CreateUsageData,
  PromotionUsageRepositoryPort,
  PromotionUsageView,
} from '../../domain/ports/promotion-usage.repository.port';

function toEntity(row: PrismaPromotionUsage): PromotionUsageEntity {
  return new PromotionUsageEntity({
    id: row.id,
    promotionId: row.promotionId,
    orderId: row.orderId,
    customerId: row.customerId,
    discountAmount: row.discountAmount.toNumber(),
    createdAt: row.createdAt,
  });
}

@Injectable()
export class PrismaPromotionUsageRepository implements PromotionUsageRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByOrderId(orderId: string): Promise<PromotionUsageEntity | null> {
    const row = await this.prisma.promotionUsage.findUnique({ where: { orderId } });
    return row ? toEntity(row) : null;
  }

  async create(data: CreateUsageData): Promise<PromotionUsageEntity> {
    const row = await this.prisma.promotionUsage.create({ data });
    return toEntity(row);
  }

  async findMany(params: PaginationParams): Promise<PaginatedResult<PromotionUsageView>> {
    const skip = (params.page - 1) * params.pageSize;

    const [rows, total] = await Promise.all([
      this.prisma.promotionUsage.findMany({
        include: { promotion: { select: { name: true, code: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: params.pageSize,
      }),
      this.prisma.promotionUsage.count(),
    ]);

    return {
      items: rows.map((row) => ({
        id: row.id,
        promotionId: row.promotionId,
        promotionName: row.promotion.name,
        promotionCode: row.promotion.code,
        orderId: row.orderId,
        customerId: row.customerId,
        discountAmount: row.discountAmount.toNumber(),
        createdAt: row.createdAt,
      })),
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
    };
  }
}
