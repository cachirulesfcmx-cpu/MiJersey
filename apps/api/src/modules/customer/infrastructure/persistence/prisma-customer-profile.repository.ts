import { Injectable } from '@nestjs/common';
import type { CustomerProfile as PrismaCustomerProfile, Prisma } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { DEFAULT_PREFERENCES } from '../../customer.constants';
import type { CustomerPreferences } from '../../domain/entities/customer-profile.entity';
import { CustomerProfileEntity } from '../../domain/entities/customer-profile.entity';
import type {
  CustomerProfileRepositoryPort,
  UpsertCustomerProfileData,
} from '../../domain/ports/customer-profile.repository.port';

function toEntity(row: PrismaCustomerProfile): CustomerProfileEntity {
  return new CustomerProfileEntity({
    id: row.id,
    userId: row.userId,
    phone: row.phone,
    preferences: (row.preferences as unknown as CustomerPreferences) ?? DEFAULT_PREFERENCES,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

@Injectable()
export class PrismaCustomerProfileRepository implements CustomerProfileRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<CustomerProfileEntity | null> {
    const row = await this.prisma.customerProfile.findUnique({ where: { userId } });
    return row ? toEntity(row) : null;
  }

  async upsert(userId: string, data: UpsertCustomerProfileData): Promise<CustomerProfileEntity> {
    const preferences = data.preferences as unknown as Prisma.InputJsonValue | undefined;
    const row = await this.prisma.customerProfile.upsert({
      where: { userId },
      create: {
        userId,
        phone: data.phone ?? null,
        preferences: preferences ?? (DEFAULT_PREFERENCES as unknown as Prisma.InputJsonValue),
      },
      update: {
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
        ...(preferences !== undefined ? { preferences } : {}),
      },
    });
    return toEntity(row);
  }
}
