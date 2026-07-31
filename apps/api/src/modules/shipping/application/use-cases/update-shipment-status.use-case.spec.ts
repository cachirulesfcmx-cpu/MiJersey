import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import type { UpdateOrderStatusUseCase } from '../../../orders/application/use-cases/update-order-status.use-case';
import { ShipmentEntity } from '../../domain/entities/shipment.entity';
import {
  ShipmentNotFoundError,
  ShipmentNotUpdatableError,
} from '../../domain/errors/shipping.errors';
import type { ShipmentRepositoryPort } from '../../domain/ports/shipment.repository.port';
import type { ShipmentEventRepositoryPort } from '../../domain/ports/shipment-event.repository.port';
import { ShipmentStatus } from '../../domain/value-objects/shipment-status';
import { UpdateShipmentStatusUseCase } from './update-shipment-status.use-case';

function buildShipment(status: ShipmentStatus): ShipmentEntity {
  return new ShipmentEntity({
    id: 'shipment-1',
    orderId: 'order-1',
    carrierId: 'carrier-1',
    service: 'standard',
    trackingNumber: 'MJ-ABC123',
    labelUrl: null,
    status,
    shippedAt: null,
    deliveredAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildUseCase(options: { shipment?: ShipmentEntity | null } = {}) {
  const shipments: jest.Mocked<ShipmentRepositoryPort> = {
    findById: jest
      .fn()
      .mockResolvedValue(
        options.shipment === undefined
          ? buildShipment(ShipmentStatus.LABEL_CREATED)
          : options.shipment,
      ),
    findByOrderId: jest.fn(),
    findByTrackingNumber: jest.fn(),
    create: jest.fn(),
    updateStatus: jest
      .fn()
      .mockImplementation((id, data) =>
        Promise.resolve(buildShipment(data.status as ShipmentStatus)),
      ),
  };
  const events: jest.Mocked<ShipmentEventRepositoryPort> = {
    findByShipmentId: jest.fn(),
    create: jest.fn().mockResolvedValue(undefined),
  };
  const updateOrderStatus = {
    execute: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<UpdateOrderStatusUseCase>;
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  return {
    useCase: new UpdateShipmentStatusUseCase(shipments, events, updateOrderStatus, auditLog),
    shipments,
    events,
    updateOrderStatus,
    auditLog,
  };
}

describe('UpdateShipmentStatusUseCase', () => {
  const baseInput = { id: 'shipment-1', actorUserId: 'admin-1', ipAddress: null };

  it('throws ShipmentNotFoundError when the shipment does not exist', async () => {
    const { useCase } = buildUseCase({ shipment: null });

    await expect(
      useCase.execute({ ...baseInput, status: ShipmentStatus.IN_TRANSIT }),
    ).rejects.toThrow(ShipmentNotFoundError);
  });

  it('throws ShipmentNotUpdatableError when the shipment is already delivered', async () => {
    const { useCase } = buildUseCase({ shipment: buildShipment(ShipmentStatus.DELIVERED) });

    await expect(
      useCase.execute({ ...baseInput, status: ShipmentStatus.IN_TRANSIT }),
    ).rejects.toThrow(ShipmentNotUpdatableError);
  });

  it('moves the order fulfillmentStatus to SHIPPED when the shipment goes IN_TRANSIT', async () => {
    const { useCase, updateOrderStatus } = buildUseCase();

    await useCase.execute({ ...baseInput, status: ShipmentStatus.IN_TRANSIT });

    expect(updateOrderStatus.execute).toHaveBeenCalledWith(
      expect.objectContaining({ field: 'fulfillmentStatus', value: 'SHIPPED' }),
    );
  });

  it('moves the order fulfillmentStatus to DELIVERED when the shipment is delivered', async () => {
    const { useCase, updateOrderStatus } = buildUseCase({
      shipment: buildShipment(ShipmentStatus.IN_TRANSIT),
    });

    await useCase.execute({ ...baseInput, status: ShipmentStatus.DELIVERED });

    expect(updateOrderStatus.execute).toHaveBeenCalledWith(
      expect.objectContaining({ field: 'fulfillmentStatus', value: 'DELIVERED' }),
    );
  });

  it('does not touch the order fulfillmentStatus when the shipment fails', async () => {
    const { useCase, updateOrderStatus } = buildUseCase();

    await useCase.execute({ ...baseInput, status: ShipmentStatus.FAILED });

    expect(updateOrderStatus.execute).not.toHaveBeenCalled();
  });

  it('records a status_changed event and an audit log entry', async () => {
    const { useCase, events, auditLog } = buildUseCase();

    await useCase.execute({ ...baseInput, status: ShipmentStatus.IN_TRANSIT });

    expect(events.create).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'status_changed' }),
    );
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'shipping.shipment.status_changed' }),
    );
  });
});
