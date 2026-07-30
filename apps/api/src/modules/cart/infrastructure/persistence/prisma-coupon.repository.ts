import { Injectable } from '@nestjs/common';
import type { Coupon as PrismaCoupon } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { CouponEntity } from '../../domain/entities/coupon.entity';
import type {
  CouponRepositoryPort,
  CreateCouponData,
  UpdateCouponData,
} from '../../domain/ports/coupon.repository.port';
import type { CouponType } from '../../domain/value-objects/cart-enums';

function toEntity(row: PrismaCoupon): CouponEntity {
  return new CouponEntity({
    id: row.id,
    code: row.code,
    type: row.type as CouponType,
    value: row.value.toNumber(),
    isActive: row.isActive,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

@Injectable()
export class PrismaCouponRepository implements CouponRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<CouponEntity | null> {
    const row = await this.prisma.coupon.findUnique({ where: { id } });
    return row ? toEntity(row) : null;
  }

  async findByCode(code: string): Promise<CouponEntity | null> {
    const row = await this.prisma.coupon.findUnique({ where: { code } });
    return row ? toEntity(row) : null;
  }

  async findMany(): Promise<CouponEntity[]> {
    const rows = await this.prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map(toEntity);
  }

  async create(data: CreateCouponData): Promise<CouponEntity> {
    const row = await this.prisma.coupon.create({ data });
    return toEntity(row);
  }

  async update(id: string, data: UpdateCouponData): Promise<CouponEntity> {
    const row = await this.prisma.coupon.update({ where: { id }, data });
    return toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.coupon.delete({ where: { id } });
  }
}
