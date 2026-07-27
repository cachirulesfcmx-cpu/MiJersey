import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { InventoryItemEntity } from '../../domain/entities/inventory-item.entity';
import { WarehouseEntity } from '../../domain/entities/warehouse.entity';
import {
  InsufficientStockError,
  InvalidMovementTypeError,
} from '../../domain/errors/inventory.errors';
import type { InventoryItemRepositoryPort } from '../../domain/ports/inventory-item.repository.port';
import type { VariantQueryPort } from '../../domain/ports/variant-query.port';
import type { WarehouseRepositoryPort } from '../../domain/ports/warehouse.repository.port';
import { InventoryMovementType, WarehouseStatus } from '../../domain/value-objects/inventory-enums';
import { AdjustInventoryUseCase } from './adjust-inventory.use-case';

function buildItem(available = 10, version = 0) {
  return new InventoryItemEntity({
    id: 'item-1',
    variantId: 'variant-1',
    warehouseId: 'wh-1',
    availableQuantity: available,
    reservedQuantity: 0,
    incomingQuantity: 0,
    safetyStock: 0,
    version,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildWarehouse(): WarehouseEntity {
  return new WarehouseEntity({
    id: 'wh-1',
    code: 'MAIN',
    name: 'Principal',
    status: WarehouseStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildUseCase(available = 10) {
  const items = {
    findOrCreate: jest.fn().mockResolvedValue(buildItem(available)),
    applyMovement: jest.fn().mockImplementation((input) =>
      Promise.resolve({
        item: buildItem(available + (input.delta.availableDelta ?? 0), input.version + 1),
        movement: { id: 'mv-1' },
      }),
    ),
  } as unknown as jest.Mocked<InventoryItemRepositoryPort>;
  const warehouses = {
    findById: jest.fn().mockResolvedValue(buildWarehouse()),
  } as unknown as jest.Mocked<WarehouseRepositoryPort>;
  const variantQuery = {
    exists: jest.fn().mockResolvedValue(true),
  } as unknown as jest.Mocked<VariantQueryPort>;
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  return { useCase: new AdjustInventoryUseCase(items, warehouses, variantQuery, auditLog), items };
}

describe('AdjustInventoryUseCase', () => {
  it('rejects RESERVATION as a manual adjustment type', async () => {
    const { useCase } = buildUseCase();

    await expect(
      useCase.execute({
        variantId: 'variant-1',
        warehouseId: 'wh-1',
        type: InventoryMovementType.RESERVATION,
        quantity: 1,
        actorUserId: 'staff-1',
        ipAddress: null,
      }),
    ).rejects.toBeInstanceOf(InvalidMovementTypeError);
  });

  it('rejects a negative adjustment that would leave available stock below zero', async () => {
    const { useCase } = buildUseCase(3);

    await expect(
      useCase.execute({
        variantId: 'variant-1',
        warehouseId: 'wh-1',
        type: InventoryMovementType.ADJUSTMENT_NEGATIVE,
        quantity: 5,
        actorUserId: 'staff-1',
        ipAddress: null,
      }),
    ).rejects.toBeInstanceOf(InsufficientStockError);
  });

  it('allows going negative when allowNegative is explicitly set', async () => {
    const { useCase, items } = buildUseCase(3);

    await useCase.execute({
      variantId: 'variant-1',
      warehouseId: 'wh-1',
      type: InventoryMovementType.ADJUSTMENT_NEGATIVE,
      quantity: 5,
      allowNegative: true,
      actorUserId: 'staff-1',
      ipAddress: null,
    });

    expect(items.applyMovement).toHaveBeenCalledWith(
      expect.objectContaining({ delta: { availableDelta: -5 } }),
    );
  });

  it('increases available stock for INBOUND', async () => {
    const { useCase, items } = buildUseCase(10);

    await useCase.execute({
      variantId: 'variant-1',
      warehouseId: 'wh-1',
      type: InventoryMovementType.INBOUND,
      quantity: 7,
      actorUserId: 'staff-1',
      ipAddress: null,
    });

    expect(items.applyMovement).toHaveBeenCalledWith(
      expect.objectContaining({ delta: { availableDelta: 7 } }),
    );
  });
});
