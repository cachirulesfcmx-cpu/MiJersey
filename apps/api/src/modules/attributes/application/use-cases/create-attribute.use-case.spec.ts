import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AttributeEntity } from '../../domain/entities/attribute.entity';
import {
  AttributeCodeAlreadyExistsError,
  DuplicateAttributeValueError,
} from '../../domain/errors/attribute.errors';
import type { AttributeRepositoryPort } from '../../domain/ports/attribute.repository.port';
import { AttributeStatus, AttributeType } from '../../domain/value-objects/attribute-enums';
import { AttributeCacheService } from '../services/attribute-cache.service';
import { CreateAttributeUseCase } from './create-attribute.use-case';

function buildAttribute(overrides: Partial<{ isFilterable: boolean }> = {}): AttributeEntity {
  return new AttributeEntity({
    id: 'attr-1',
    code: 'color',
    name: 'Color',
    type: AttributeType.LIST,
    isFilterable: overrides.isFilterable ?? false,
    isComparable: false,
    isRequired: false,
    sortOrder: 0,
    status: AttributeStatus.ACTIVE,
    values: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildUseCase(existsByCode = false) {
  const attributes = {
    existsByCode: jest.fn().mockResolvedValue(existsByCode),
    create: jest
      .fn()
      .mockImplementation((data) =>
        Promise.resolve(buildAttribute({ isFilterable: data.isFilterable })),
      ),
  } as unknown as jest.Mocked<AttributeRepositoryPort>;
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };
  const cache = {
    invalidateDefaultFacets: jest.fn().mockResolvedValue(undefined),
  } as unknown as AttributeCacheService;

  return { useCase: new CreateAttributeUseCase(attributes, auditLog, cache), attributes, cache };
}

describe('CreateAttributeUseCase', () => {
  it('derives the code from the name when not provided', async () => {
    const { useCase, attributes } = buildUseCase();

    await useCase.execute({
      name: 'Screen Size',
      type: AttributeType.TEXT,
      actorUserId: 'staff-1',
      ipAddress: null,
    });

    expect(attributes.create).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'screen_size' }),
    );
  });

  it('rejects a duplicate code', async () => {
    const { useCase } = buildUseCase(true);

    await expect(
      useCase.execute({
        code: 'color',
        name: 'Color',
        type: AttributeType.LIST,
        actorUserId: 'staff-1',
        ipAddress: null,
      }),
    ).rejects.toBeInstanceOf(AttributeCodeAlreadyExistsError);
  });

  it('rejects duplicate values within the same request', async () => {
    const { useCase } = buildUseCase();

    await expect(
      useCase.execute({
        name: 'Color',
        type: AttributeType.LIST,
        values: [
          { value: 'red', label: 'Rojo' },
          { value: 'red', label: 'Rojo otra vez' },
        ],
        actorUserId: 'staff-1',
        ipAddress: null,
      }),
    ).rejects.toBeInstanceOf(DuplicateAttributeValueError);
  });

  it('invalidates the facets cache only when the attribute is filterable', async () => {
    const { useCase, cache } = buildUseCase();

    await useCase.execute({
      name: 'Color',
      type: AttributeType.LIST,
      isFilterable: true,
      actorUserId: 'staff-1',
      ipAddress: null,
    });

    expect(cache.invalidateDefaultFacets).toHaveBeenCalled();
  });
});
