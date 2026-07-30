import { Injectable } from '@nestjs/common';
import type { CheckoutAddress as PrismaCheckoutAddress } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { CheckoutAddressEntity } from '../../domain/entities/checkout-address.entity';
import type {
  CheckoutAddressRepositoryPort,
  CreateCheckoutAddressData,
} from '../../domain/ports/checkout-address.repository.port';

function toEntity(row: PrismaCheckoutAddress): CheckoutAddressEntity {
  return new CheckoutAddressEntity({
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    company: row.company,
    addressLine1: row.addressLine1,
    addressLine2: row.addressLine2,
    city: row.city,
    state: row.state,
    postalCode: row.postalCode,
    country: row.country,
    phone: row.phone,
    createdAt: row.createdAt,
  });
}

@Injectable()
export class PrismaCheckoutAddressRepository implements CheckoutAddressRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<CheckoutAddressEntity | null> {
    const row = await this.prisma.checkoutAddress.findUnique({ where: { id } });
    return row ? toEntity(row) : null;
  }

  async findByIds(ids: string[]): Promise<Map<string, CheckoutAddressEntity>> {
    if (ids.length === 0) return new Map();
    const rows = await this.prisma.checkoutAddress.findMany({ where: { id: { in: ids } } });
    return new Map(rows.map((row) => [row.id, toEntity(row)]));
  }

  async create(data: CreateCheckoutAddressData): Promise<CheckoutAddressEntity> {
    const row = await this.prisma.checkoutAddress.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        company: data.company ?? null,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 ?? null,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
        phone: data.phone ?? null,
      },
    });
    return toEntity(row);
  }
}
