import { Injectable } from '@nestjs/common';
import type { Shipment as PrismaShipment } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { ShipmentEntity } from '../../domain/entities/shipment.entity';
import type {
  CreateShipmentData,
  ShipmentRepositoryPort,
  UpdateShipmentStatusData,
} from '../../domain/ports/shipment.repository.port';

function toEntity(row: PrismaShipment): ShipmentEntity {
  return new ShipmentEntity({
    id: row.id,
    orderId: row.orderId,
    carrierId: row.carrierId,
    service: row.service,
    trackingNumber: row.trackingNumber,
    labelUrl: row.labelUrl,
    status: row.status,
    shippedAt: row.shippedAt,
    deliveredAt: row.deliveredAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

@Injectable()
export class PrismaShipmentRepository implements ShipmentRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<ShipmentEntity | null> {
    const row = await this.prisma.shipment.findUnique({ where: { id } });
    return row ? toEntity(row) : null;
  }

  async findByOrderId(orderId: string): Promise<ShipmentEntity[]> {
    const rows = await this.prisma.shipment.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toEntity);
  }

  async findByTrackingNumber(trackingNumber: string): Promise<ShipmentEntity | null> {
    const row = await this.prisma.shipment.findUnique({ where: { trackingNumber } });
    return row ? toEntity(row) : null;
  }

  async create(data: CreateShipmentData): Promise<ShipmentEntity> {
    const row = await this.prisma.shipment.create({ data });
    return toEntity(row);
  }

  async updateStatus(id: string, data: UpdateShipmentStatusData): Promise<ShipmentEntity> {
    const row = await this.prisma.shipment.update({
      where: { id },
      data: {
        status: data.status as PrismaShipment['status'],
        ...(data.shippedAt !== undefined ? { shippedAt: data.shippedAt } : {}),
        ...(data.deliveredAt !== undefined ? { deliveredAt: data.deliveredAt } : {}),
      },
    });
    return toEntity(row);
  }
}
