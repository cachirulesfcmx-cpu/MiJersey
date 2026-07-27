import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { InventoryItemEntity } from '../../domain/entities/inventory-item.entity';
import { InvalidReleaseQuantityError } from '../../domain/errors/inventory.errors';
import type { InventoryItemRepositoryPort } from '../../domain/ports/inventory-item.repository.port';
import type { VariantQueryPort } from '../../domain/ports/variant-query.port';
import { InventoryMovementType } from '../../domain/value-objects/inventory-enums';
import { ConfirmReservationUseCase } from './confirm-reservation.use-case';

function buildItem(reserved = 5, version = 0) {
  return new InventoryItemEntity({
    id: 'item-1',
    variantId: 'variant-1',
    warehouseId: 'wh-1',
    availableQuantity: 0,
    reservedQuantity: reserved,
    incomingQuantity: 0,
    safetyStock: 0,
    version,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildUseCase(reserved = 5) {
  const items = {
    findByVariantAndWarehouse: jest.fn().mockResolvedValue(buildItem(reserved)),
    applyMovement: jest.fn().mockImplementation((input) =>
      Promise.resolve({
        item: buildItem(reserved + (input.delta.reservedDelta ?? 0), input.version + 1),
        movement: { id: 'mv-1' },
      }),
    ),
  } as unknown as jest.Mocked<InventoryItemRepositoryPort>;
  const variantQuery = {
    exists: jest.fn().mockResolvedValue(true),
  } as unknown as jest.Mocked<VariantQueryPort>;
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  return { useCase: new ConfirmReservationUseCase(items, variantQuery, auditLog), items };
}

describe('ConfirmReservationUseCase', () => {
  it('rejects confirming more than what is reserved', async () => {
    const { useCase } = buildUseCase(2);

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

  it('reduces reservedQuantity only, recording an OUTBOUND movement', async () => {
    const { useCase, items } = buildUseCase(5);

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
      expect.objectContaining({
        delta: { reservedDelta: -3 },
        movement: expect.objectContaining({ type: InventoryMovementType.OUTBOUND }),
      }),
    );
  });
});
