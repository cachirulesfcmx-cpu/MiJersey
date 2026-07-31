import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import type { UpdateOrderStatusUseCase } from '../../../orders/application/use-cases/update-order-status.use-case';
import { OrderEntity } from '../../../orders/domain/entities/order.entity';
import { OrderItemEntity } from '../../../orders/domain/entities/order-item.entity';
import type { OrderRepositoryPort } from '../../../orders/domain/ports/order.repository.port';
import {
  FulfillmentStatus,
  OrderStatus,
  PaymentStatus,
} from '../../../orders/domain/value-objects/order-enums';
import { CarrierEntity } from '../../domain/entities/carrier.entity';
import { ShipmentEntity } from '../../domain/entities/shipment.entity';
import {
  CarrierNotFoundError,
  OrderNotFoundError,
  OrderNotPayableForShipmentError,
  ShipmentAlreadyActiveError,
} from '../../domain/errors/shipping.errors';
import type { CarrierRepositoryPort } from '../../domain/ports/carrier.repository.port';
import type { CarrierProviderPort } from '../../domain/ports/carrier-provider.port';
import type { ShipmentRepositoryPort } from '../../domain/ports/shipment.repository.port';
import type { ShipmentEventRepositoryPort } from '../../domain/ports/shipment-event.repository.port';
import { ShipmentStatus } from '../../domain/value-objects/shipment-status';
import { CreateShipmentUseCase } from './create-shipment.use-case';

function buildOrder(overrides: Partial<{ paymentStatus: PaymentStatus }> = {}): OrderEntity {
  return new OrderEntity({
    id: 'order-1',
    orderNumber: 'ORD-1',
    customerId: 'customer-1',
    contactEmail: 'a@example.com',
    status: OrderStatus.CONFIRMED,
    paymentStatus: overrides.paymentStatus ?? PaymentStatus.PAID,
    fulfillmentStatus: FulfillmentStatus.UNFULFILLED,
    currency: 'MXN',
    subtotal: 100,
    discountTotal: 0,
    shippingTotal: 0,
    taxTotal: 16,
    grandTotal: 116,
    couponCode: null,
    shippingAddressId: null,
    billingAddressId: null,
    shippingMethodId: null,
    cancelledAt: null,
    cancelReason: null,
    items: [
      new OrderItemEntity({
        id: 'item-1',
        orderId: 'order-1',
        productId: 'p1',
        variantId: 'v1',
        sku: 'SKU-1',
        quantity: 1,
        unitPrice: 116,
        subtotal: 116,
      }),
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildCarrier(isActive = true): CarrierEntity {
  return new CarrierEntity({
    id: 'carrier-1',
    name: 'Reparto propio',
    code: 'MANUAL',
    isActive,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

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

function buildUseCase(
  options: {
    order?: OrderEntity | null;
    carrier?: CarrierEntity | null;
    existingShipments?: ShipmentEntity[];
  } = {},
) {
  const orders: jest.Mocked<OrderRepositoryPort> = {
    findById: jest
      .fn()
      .mockResolvedValue(options.order === undefined ? buildOrder() : options.order),
    findByCustomerId: jest.fn(),
    findAll: jest.fn(),
    cancel: jest.fn(),
    updateField: jest.fn(),
  };
  const carriers: jest.Mocked<CarrierRepositoryPort> = {
    findById: jest
      .fn()
      .mockResolvedValue(options.carrier === undefined ? buildCarrier() : options.carrier),
    findByCode: jest.fn(),
    findActive: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const createdShipment = buildShipment(ShipmentStatus.LABEL_CREATED);
  const shipments: jest.Mocked<ShipmentRepositoryPort> = {
    findById: jest.fn(),
    findByOrderId: jest.fn().mockResolvedValue(options.existingShipments ?? []),
    findByTrackingNumber: jest.fn(),
    create: jest.fn().mockResolvedValue(createdShipment),
    updateStatus: jest.fn(),
  };
  const events: jest.Mocked<ShipmentEventRepositoryPort> = {
    findByShipmentId: jest.fn(),
    create: jest.fn().mockResolvedValue(undefined),
  };
  const provider: jest.Mocked<CarrierProviderPort> = {
    name: 'MANUAL',
    createShipment: jest.fn().mockResolvedValue({ trackingNumber: 'MJ-ABC123', labelUrl: null }),
  };
  const updateOrderStatus = {
    execute: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<UpdateOrderStatusUseCase>;
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  return {
    useCase: new CreateShipmentUseCase(
      orders,
      carriers,
      shipments,
      events,
      provider,
      updateOrderStatus,
      auditLog,
    ),
    orders,
    carriers,
    shipments,
    events,
    provider,
    updateOrderStatus,
    auditLog,
  };
}

describe('CreateShipmentUseCase', () => {
  const input = {
    orderId: 'order-1',
    carrierId: 'carrier-1',
    service: 'standard',
    actorUserId: 'admin-1',
    ipAddress: null,
  };

  it('throws OrderNotFoundError when the order does not exist', async () => {
    const { useCase } = buildUseCase({ order: null });

    await expect(useCase.execute(input)).rejects.toThrow(OrderNotFoundError);
  });

  it('throws OrderNotPayableForShipmentError when the order is not paid', async () => {
    const { useCase } = buildUseCase({
      order: buildOrder({ paymentStatus: PaymentStatus.PENDING }),
    });

    await expect(useCase.execute(input)).rejects.toThrow(OrderNotPayableForShipmentError);
  });

  it('throws CarrierNotFoundError when the carrier does not exist', async () => {
    const { useCase } = buildUseCase({ carrier: null });

    await expect(useCase.execute(input)).rejects.toThrow(CarrierNotFoundError);
  });

  it('throws CarrierNotFoundError when the carrier is inactive', async () => {
    const { useCase } = buildUseCase({ carrier: buildCarrier(false) });

    await expect(useCase.execute(input)).rejects.toThrow(CarrierNotFoundError);
  });

  it('throws ShipmentAlreadyActiveError when the order already has a non-terminal shipment', async () => {
    const { useCase } = buildUseCase({
      existingShipments: [buildShipment(ShipmentStatus.IN_TRANSIT)],
    });

    await expect(useCase.execute(input)).rejects.toThrow(ShipmentAlreadyActiveError);
  });

  it('allows creating a shipment when the previous one failed', async () => {
    const { useCase, shipments } = buildUseCase({
      existingShipments: [buildShipment(ShipmentStatus.FAILED)],
    });

    await useCase.execute(input);

    expect(shipments.create).toHaveBeenCalled();
  });

  it('creates the shipment, records an event, and moves the order to PROCESSING', async () => {
    const { useCase, shipments, events, updateOrderStatus, auditLog } = buildUseCase();

    await useCase.execute(input);

    expect(shipments.create).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'order-1',
        carrierId: 'carrier-1',
        trackingNumber: 'MJ-ABC123',
      }),
    );
    expect(events.create).toHaveBeenCalledWith(expect.objectContaining({ eventType: 'created' }));
    expect(updateOrderStatus.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'order-1',
        field: 'fulfillmentStatus',
        value: 'PROCESSING',
      }),
    );
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'shipping.shipment.created' }),
    );
  });
});
