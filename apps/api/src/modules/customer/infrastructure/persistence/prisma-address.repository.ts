import { Injectable } from '@nestjs/common';
import type { Address as PrismaAddress } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { AddressEntity } from '../../domain/entities/address.entity';
import type {
  AddressRepositoryPort,
  CreateAddressData,
  UpdateAddressData,
} from '../../domain/ports/address.repository.port';
import type { AddressType } from '../../domain/value-objects/address-enums';

function toEntity(row: PrismaAddress): AddressEntity {
  return new AddressEntity({
    id: row.id,
    customerId: row.customerId,
    type: row.type as AddressType,
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
    isDefault: row.isDefault,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

@Injectable()
export class PrismaAddressRepository implements AddressRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<AddressEntity | null> {
    const row = await this.prisma.address.findUnique({ where: { id } });
    return row ? toEntity(row) : null;
  }

  async findByCustomerId(customerId: string): Promise<AddressEntity[]> {
    const rows = await this.prisma.address.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toEntity);
  }

  async findDefaultByType(customerId: string, type: AddressType): Promise<AddressEntity | null> {
    const row = await this.prisma.address.findFirst({
      where: { customerId, type, isDefault: true },
    });
    return row ? toEntity(row) : null;
  }

  async create(data: CreateAddressData): Promise<AddressEntity> {
    const row = await this.prisma.address.create({
      data: {
        customerId: data.customerId,
        type: data.type,
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
        isDefault: data.isDefault ?? false,
      },
    });
    return toEntity(row);
  }

  async update(id: string, data: UpdateAddressData): Promise<AddressEntity> {
    const row = await this.prisma.address.update({ where: { id }, data });
    return toEntity(row);
  }

  async unsetDefault(id: string): Promise<void> {
    await this.prisma.address.update({ where: { id }, data: { isDefault: false } });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.address.delete({ where: { id } });
  }
}
