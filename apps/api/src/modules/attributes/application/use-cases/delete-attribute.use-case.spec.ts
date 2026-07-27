import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AttributeEntity } from '../../domain/entities/attribute.entity';
import { AttributeNotFoundError } from '../../domain/errors/attribute.errors';
import type { AttributeRepositoryPort } from '../../domain/ports/attribute.repository.port';
import { AttributeStatus, AttributeType } from '../../domain/value-objects/attribute-enums';
import { AttributeCacheService } from '../services/attribute-cache.service';
import { DeleteAttributeUseCase } from './delete-attribute.use-case';

function buildAttribute(isFilterable = false): AttributeEntity {
  return new AttributeEntity({
    id: 'attr-1',
    code: 'color',
    name: 'Color',
    type: AttributeType.LIST,
    isFilterable,
    isComparable: false,
    isRequired: false,
    sortOrder: 0,
    status: AttributeStatus.ACTIVE,
    values: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('DeleteAttributeUseCase', () => {
  it('throws when the attribute does not exist', async () => {
    const attributes = {
      findById: jest.fn().mockResolvedValue(null),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<AttributeRepositoryPort>;
    const auditLog: jest.Mocked<AuditLogRepositoryPort> = { record: jest.fn() };
    const cache = { invalidateDefaultFacets: jest.fn() } as unknown as AttributeCacheService;
    const useCase = new DeleteAttributeUseCase(attributes, auditLog, cache);

    await expect(
      useCase.execute({ id: 'missing', actorUserId: 'staff-1', ipAddress: null }),
    ).rejects.toBeInstanceOf(AttributeNotFoundError);
  });

  it('soft-deletes, records the logical-deletion audit entry, and invalidates the cache when filterable', async () => {
    const attributes = {
      findById: jest.fn().mockResolvedValue(buildAttribute(true)),
      softDelete: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<AttributeRepositoryPort>;
    const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
      record: jest.fn().mockResolvedValue(undefined),
    };
    const cache = {
      invalidateDefaultFacets: jest.fn().mockResolvedValue(undefined),
    } as unknown as AttributeCacheService;
    const useCase = new DeleteAttributeUseCase(attributes, auditLog, cache);

    await useCase.execute({ id: 'attr-1', actorUserId: 'staff-1', ipAddress: null });

    expect(attributes.softDelete).toHaveBeenCalledWith('attr-1');
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'attributes.attribute.deleted' }),
    );
    expect(cache.invalidateDefaultFacets).toHaveBeenCalled();
  });
});
