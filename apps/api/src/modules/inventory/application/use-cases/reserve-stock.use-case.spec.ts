import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { InventoryItemEntity } from '../../domain/entities/inventory-item.entity';
import { WarehouseEntity } from '../../domain/entities/warehouse.entity';
import {
  InsufficientStockError,
  InventoryItemNotFoundError,
  VariantNotFoundError,
  WarehouseNotActiveError,
  WarehouseNotFoundError,
} from '../../domain/errors/inventory.errors';
import type { InventoryItemRepositoryPort } from '../../domain/ports/inventory-item.repository.port';
import type { VariantQueryPort } from '../../domain/ports/variant-query.port';
import type { WarehouseRepositoryPort } from '../../domain/ports/warehouse.repository.port';
import { WarehouseStatus } from '../../domain/value-objects/inventory-enums';
import { ReserveStockUseCase } from './reserve-stock.use-case';

function buildItem(
  overrides: Partial<{ available: number; reserved: number; version: number }> = {},
) {
  return new InventoryItemEntity({
    id: 'item-1',
    variantId: 'variant-1',
    warehouseId: 'wh-1',
    availableQuantity: overrides.available ?? 10,
    reservedQuantity: overrides.reserved ?? 0,
    incomingQuantity: 0,
    safetyStock: 0,
    version: overrides.version ?? 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildWarehouse(status: WarehouseStatus = WarehouseStatus.ACTIVE): WarehouseEntity {
  return new WarehouseEntity({
    id: 'wh-1',
    code: 'MAIN',
    name: 'Principal',
    status,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildUseCase(options: {
  variantExists?: boolean;
  warehouse?: WarehouseEntity | null;
  item?: InventoryItemEntity | null;
}) {
  const warehouse = 'warehouse' in options ? options.warehouse : buildWarehouse();
  const items = {
    findByVariantAndWarehouse: jest.fn().mockResolvedValue(options.item ?? null),
    applyMovement: jest.fn().mockImplementation((input) =>
      Promise.resolve({
        item: buildItem({
          available: 10 + (input.delta.availableDelta ?? 0),
          reserved: input.delta.reservedDelta ?? 0,
          version: input.version + 1,
        }),
        movement: { id: 'mv-1' },
      }),
    ),
  } as unknown as jest.Mocked<InventoryItemRepositoryPort>;
  const warehouses = {
    findById: jest.fn().mockResolvedValue(warehouse),
  } as unknown as jest.Mocked<WarehouseRepositoryPort>;
  const variantQuery = {
    exists: jest.fn().mockResolvedValue(options.variantExists ?? true),
  } as unknown as jest.Mocked<VariantQueryPort>;
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  return {
    useCase: new ReserveStockUseCase(items, warehouses, variantQuery, auditLog),
    items,
  };
}

describe('ReserveStockUseCase', () => {
  it('rejects when the variant does not exist', async () => {
    const { useCase } = buildUseCase({ variantExists: false });

    await expect(
      useCase.execute({
        variantId: 'missing',
        warehouseId: 'wh-1',
        quantity: 1,
        referenceType: 'ORDER',
        referenceId: 'order-1',
        actorUserId: 'staff-1',
        ipAddress: null,
      }),
    ).rejects.toBeInstanceOf(VariantNotFoundError);
  });

  it('rejects when the warehouse does not exist', async () => {
    const { useCase } = buildUseCase({ warehouse: null });

    await expect(
      useCase.execute({
        variantId: 'variant-1',
        warehouseId: 'missing',
        quantity: 1,
        referenceType: 'ORDER',
        referenceId: 'order-1',
        actorUserId: 'staff-1',
        ipAddress: null,
      }),
    ).rejects.toBeInstanceOf(WarehouseNotFoundError);
  });

  it('rejects when the warehouse is archived', async () => {
    const { useCase } = buildUseCase({ warehouse: buildWarehouse(WarehouseStatus.ARCHIVED) });

    await expect(
      useCase.execute({
        variantId: 'variant-1',
        warehouseId: 'wh-1',
        quantity: 1,
        referenceType: 'ORDER',
        referenceId: 'order-1',
        actorUserId: 'staff-1',
        ipAddress: null,
      }),
    ).rejects.toBeInstanceOf(WarehouseNotActiveError);
  });

  it('rejects when there is no inventory item for that variant/warehouse', async () => {
    const { useCase } = buildUseCase({ item: null });

    await expect(
      useCase.execute({
        variantId: 'variant-1',
        warehouseId: 'wh-1',
        quantity: 1,
        referenceType: 'ORDER',
        referenceId: 'order-1',
        actorUserId: 'staff-1',
        ipAddress: null,
      }),
    ).rejects.toBeInstanceOf(InventoryItemNotFoundError);
  });

  it('rejects when available stock is insufficient', async () => {
    const { useCase } = buildUseCase({ item: buildItem({ available: 2 }) });

    await expect(
      useCase.execute({
        variantId: 'variant-1',
        warehouseId: 'wh-1',
        quantity: 5,
        referenceType: 'ORDER',
        referenceId: 'order-1',
        actorUserId: 'staff-1',
        ipAddress: null,
      }),
    ).rejects.toBeInstanceOf(InsufficientStockError);
  });

  it('reserves stock, moving it from available to reserved', async () => {
    const { useCase, items } = buildUseCase({ item: buildItem({ available: 10 }) });

    await useCase.execute({
      variantId: 'variant-1',
      warehouseId: 'wh-1',
      quantity: 3,
      referenceType: 'ORDER',
      referenceId: 'order-1',
      actorUserId: 'staff-1',
      ipAddress: null,
    });

    expect(items.applyMovement).toHaveBeenCalledWith(
      expect.objectContaining({ delta: { availableDelta: -3, reservedDelta: 3 } }),
    );
  });
});
