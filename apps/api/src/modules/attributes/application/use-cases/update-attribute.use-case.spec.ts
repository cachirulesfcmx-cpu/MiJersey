import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AttributeEntity } from '../../domain/entities/attribute.entity';
import { AttributeValueEntity } from '../../domain/entities/attribute-value.entity';
import {
  AttributeInUseError,
  AttributeValueInUseError,
} from '../../domain/errors/attribute.errors';
import type { AttributeRepositoryPort } from '../../domain/ports/attribute.repository.port';
import { AttributeStatus, AttributeType } from '../../domain/value-objects/attribute-enums';
import { AttributeCacheService } from '../services/attribute-cache.service';
import { UpdateAttributeUseCase } from './update-attribute.use-case';

function buildAttribute(): AttributeEntity {
  return new AttributeEntity({
    id: 'attr-1',
    code: 'color',
    name: 'Color',
    type: AttributeType.LIST,
    isFilterable: true,
    isComparable: false,
    isRequired: false,
    sortOrder: 0,
    status: AttributeStatus.ACTIVE,
    values: [
      new AttributeValueEntity({
        id: 'val-1',
        attributeId: 'attr-1',
        value: 'red',
        label: 'Rojo',
        sortOrder: 0,
      }),
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildUseCase(assignmentCount = 0, valueAssignmentCount = 0) {
  const attributes: jest.Mocked<AttributeRepositoryPort> = {
    findById: jest.fn().mockResolvedValue(buildAttribute()),
    findByCode: jest.fn(),
    existsByCode: jest.fn(),
    findByIds: jest.fn(),
    findAllFilterable: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn().mockResolvedValue(undefined),
    replaceValues: jest.fn().mockResolvedValue(undefined),
    softDelete: jest.fn(),
    countAssignments: jest.fn().mockResolvedValue(assignmentCount),
    countValueAssignments: jest.fn().mockResolvedValue(valueAssignmentCount),
  };
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };
  const cache = {
    invalidateDefaultFacets: jest.fn().mockResolvedValue(undefined),
  } as unknown as AttributeCacheService;

  return { useCase: new UpdateAttributeUseCase(attributes, auditLog, cache), attributes, cache };
}

describe('UpdateAttributeUseCase', () => {
  it('rejects a type change when the attribute is already assigned to products', async () => {
    const { useCase } = buildUseCase(1);

    await expect(
      useCase.execute({
        id: 'attr-1',
        type: AttributeType.TEXT,
        actorUserId: 'staff-1',
        ipAddress: null,
      }),
    ).rejects.toBeInstanceOf(AttributeInUseError);
  });

  it('allows a type change when nothing is assigned', async () => {
    const { useCase, attributes } = buildUseCase(0);

    await useCase.execute({
      id: 'attr-1',
      type: AttributeType.TEXT,
      actorUserId: 'staff-1',
      ipAddress: null,
    });

    expect(attributes.update).toHaveBeenCalledWith(
      'attr-1',
      expect.objectContaining({ type: AttributeType.TEXT }),
    );
  });

  it('rejects removing a value that is still assigned to products', async () => {
    const { useCase } = buildUseCase(0, 1);

    await expect(
      useCase.execute({
        id: 'attr-1',
        values: [],
        actorUserId: 'staff-1',
        ipAddress: null,
      }),
    ).rejects.toBeInstanceOf(AttributeValueInUseError);
  });

  it('invalidates the facets cache when isFilterable changes', async () => {
    const { useCase, cache } = buildUseCase();

    await useCase.execute({
      id: 'attr-1',
      isFilterable: false,
      actorUserId: 'staff-1',
      ipAddress: null,
    });

    expect(cache.invalidateDefaultFacets).toHaveBeenCalled();
  });
});
