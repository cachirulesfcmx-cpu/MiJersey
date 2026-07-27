import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { InventoryItemEntity } from '../../domain/entities/inventory-item.entity';
import {
  InvalidReleaseQuantityError,
  InventoryItemNotFoundError,
  VariantNotFoundError,
} from '../../domain/errors/inventory.errors';
import type { InventoryItemRepositoryPort } from '../../domain/ports/inventory-item.repository.port';
import type { VariantQueryPort } from '../../domain/ports/variant-query.port';
import { ReleaseStockUseCase } from './release-stock.use-case';

function buildItem(
  overrides: Partial<{ available: number; reserved: number; version: number }> = {},
) {
  return new InventoryItemEntity({
    id: 'item-1',
    variantId: 'variant-1',
    warehouseId: 'wh-1',
    availableQuantity: overrides.available ?? 5,
    reservedQuantity: overrides.reserved ?? 3,
    incomingQuantity: 0,
    safetyStock: 0,
    version: overrides.version ?? 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildUseCase(options: { variantExists?: boolean; item?: InventoryItemEntity | null }) {
  const items = {
    findByVariantAndWarehouse: jest.fn().mockResolvedValue(options.item ?? null),
    applyMovement: jest.fn().mockImplementation((input) =>
      Promise.resolve({
        item: buildItem({
          available: 5 + (input.delta.availableDelta ?? 0),
          reserved: 3 + (input.delta.reservedDelta ?? 0),
          version: input.version + 1,
        }),
        movement: { id: 'mv-1' },
      }),
    ),
  } as unknown as jest.Mocked<InventoryItemRepositoryPort>;
  const variantQuery = {
    exists: jest.fn().mockResolvedValue(options.variantExists ?? true),
  } as unknown as jest.Mocked<VariantQueryPort>;
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  return { useCase: new ReleaseStockUseCase(items, variantQuery, auditLog), items };
}

describe('ReleaseStockUseCase', () => {
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

  it('rejects when there is no inventory item', async () => {
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

  it('rejects releasing more than what is reserved', async () => {
    const { useCase } = buildUseCase({ item: buildItem({ reserved: 2 }) });

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
    ).rejects.toBeInstanceOf(InvalidReleaseQuantityError);
  });

  it('releases stock, moving it from reserved back to available', async () => {
    const { useCase, items } = buildUseCase({ item: buildItem({ reserved: 3 }) });

    await useCase.execute({
      variantId: 'variant-1',
      warehouseId: 'wh-1',
      quantity: 2,
      referenceType: 'ORDER',
      referenceId: 'order-1',
      actorUserId: 'staff-1',
      ipAddress: null,
    });

    expect(items.applyMovement).toHaveBeenCalledWith(
      expect.objectContaining({ delta: { availableDelta: 2, reservedDelta: -2 } }),
    );
  });
});
