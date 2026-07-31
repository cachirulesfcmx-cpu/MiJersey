import { Injectable } from '@nestjs/common';
import type { Prisma, ShipmentEvent as PrismaShipmentEvent } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { ShipmentEventEntity } from '../../domain/entities/shipment-event.entity';
import type {
  CreateShipmentEventData,
  ShipmentEventRepositoryPort,
} from '../../domain/ports/shipment-event.repository.port';

function toEntity(row: PrismaShipmentEvent): ShipmentEventEntity {
  return new ShipmentEventEntity({
    id: row.id,
    shipmentId: row.shipmentId,
    eventType: row.eventType,
    payload: row.payload as Record<string, unknown>,
    createdAt: row.createdAt,
  });
}

@Injectable()
export class PrismaShipmentEventRepository implements ShipmentEventRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByShipmentId(shipmentId: string): Promise<ShipmentEventEntity[]> {
    const rows = await this.prisma.shipmentEvent.findMany({
      where: { shipmentId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(toEntity);
  }

  async create(data: CreateShipmentEventData): Promise<ShipmentEventEntity> {
    const row = await this.prisma.shipmentEvent.create({
      data: {
        shipmentId: data.shipmentId,
        eventType: data.eventType,
        payload: data.payload as Prisma.InputJsonValue,
      },
    });
    return toEntity(row);
  }
}
