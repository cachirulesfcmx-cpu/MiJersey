import type { PaginatedResult } from '@mijersey/shared-types';
import { Injectable } from '@nestjs/common';
import type {
  Promotion as PrismaPromotion,
  PromotionRule as PrismaPromotionRule,
} from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { PromotionEntity } from '../../domain/entities/promotion.entity';
import { PromotionRuleEntity } from '../../domain/entities/promotion-rule.entity';
import type {
  CreatePromotionData,
  ListPromotionsParams,
  PromotionRepositoryPort,
  UpdatePromotionData,
} from '../../domain/ports/promotion.repository.port';
import type {
  PromotionDiscountType,
  PromotionRuleOperator,
  PromotionRuleType,
  PromotionStatus,
  PromotionType,
} from '../../domain/value-objects/promotion-enums';

type PromotionWithRules = PrismaPromotion & { rules: PrismaPromotionRule[] };

function toRuleEntity(row: PrismaPromotionRule): PromotionRuleEntity {
  return new PromotionRuleEntity({
    id: row.id,
    promotionId: row.promotionId,
    ruleType: row.ruleType as PromotionRuleType,
    operator: row.operator as PromotionRuleOperator,
    value: row.value,
    createdAt: row.createdAt,
  });
}

function toEntity(row: PromotionWithRules): PromotionEntity {
  return new PromotionEntity({
    id: row.id,
    name: row.name,
    code: row.code,
    type: row.type as PromotionType,
    discountType: row.discountType as PromotionDiscountType,
    discountValue: row.discountValue.toNumber(),
    status: row.status as PromotionStatus,
    priority: row.priority,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    usageLimit: row.usageLimit,
    usageCount: row.usageCount,
    stackable: row.stackable,
    rules: row.rules.map(toRuleEntity),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

@Injectable()
export class PrismaPromotionRepository implements PromotionRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<PromotionEntity | null> {
    const row = await this.prisma.promotion.findUnique({ where: { id }, include: { rules: true } });
    return row ? toEntity(row) : null;
  }

  async findByCode(code: string): Promise<PromotionEntity | null> {
    const row = await this.prisma.promotion.findUnique({
      where: { code },
      include: { rules: true },
    });
    return row ? toEntity(row) : null;
  }

  async findActiveAutomatic(): Promise<PromotionEntity[]> {
    const rows = await this.prisma.promotion.findMany({
      where: { status: 'ACTIVE', type: 'AUTOMATIC' },
      include: { rules: true },
      orderBy: { priority: 'asc' },
    });
    return rows.map(toEntity);
  }

  async findMany(params: ListPromotionsParams): Promise<PaginatedResult<PromotionEntity>> {
    const skip = (params.page - 1) * params.pageSize;
    const where = params.status ? { status: params.status } : {};

    const [rows, total] = await Promise.all([
      this.prisma.promotion.findMany({
        where,
        include: { rules: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: params.pageSize,
      }),
      this.prisma.promotion.count({ where }),
    ]);

    return {
      items: rows.map(toEntity),
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
    };
  }

  async create(data: CreatePromotionData): Promise<PromotionEntity> {
    const row = await this.prisma.promotion.create({
      data: {
        name: data.name,
        code: data.code ?? null,
        type: data.type,
        discountType: data.discountType,
        discountValue: data.discountValue,
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.priority !== undefined ? { priority: data.priority } : {}),
        startsAt: data.startsAt ?? null,
        endsAt: data.endsAt ?? null,
        usageLimit: data.usageLimit ?? null,
        ...(data.stackable !== undefined ? { stackable: data.stackable } : {}),
        rules: { create: data.rules },
      },
      include: { rules: true },
    });
    return toEntity(row);
  }

  async update(id: string, data: UpdatePromotionData): Promise<PromotionEntity> {
    const { rules, ...rest } = data;
    const row = await this.prisma.promotion.update({
      where: { id },
      data: {
        ...rest,
        ...(rules !== undefined ? { rules: { deleteMany: {}, create: rules } } : {}),
      },
      include: { rules: true },
    });
    return toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.promotion.delete({ where: { id } });
  }

  async incrementUsageCount(id: string): Promise<void> {
    await this.prisma.promotion.update({ where: { id }, data: { usageCount: { increment: 1 } } });
  }
}
