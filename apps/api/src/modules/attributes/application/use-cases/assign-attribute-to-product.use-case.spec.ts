import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AttributeEntity } from '../../domain/entities/attribute.entity';
import { AttributeValueEntity } from '../../domain/entities/attribute-value.entity';
import { ProductAttributeEntity } from '../../domain/entities/product-attribute.entity';
import {
  AttributeNotFoundError,
  InvalidAttributeAssignmentError,
  ProductNotFoundError,
} from '../../domain/errors/attribute.errors';
import type { AttributeRepositoryPort } from '../../domain/ports/attribute.repository.port';
import type { ProductAttributeRepositoryPort } from '../../domain/ports/product-attribute.repository.port';
import type { ProductQueryPort } from '../../domain/ports/product-query.port';
import { AttributeStatus, AttributeType } from '../../domain/value-objects/attribute-enums';
import { AttributeCacheService } from '../services/attribute-cache.service';
import { AssignAttributeToProductUseCase } from './assign-attribute-to-product.use-case';

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

function buildUseCase(productExists = true, attribute: AttributeEntity | null = buildAttribute()) {
  const attributes = {
    findById: jest.fn().mockResolvedValue(attribute),
  } as unknown as jest.Mocked<AttributeRepositoryPort>;
  const productAttributes = {
    upsert: jest.fn().mockImplementation((productId, data) =>
      Promise.resolve(
        new ProductAttributeEntity({
          id: 'pa-1',
          productId,
          attributeId: data.attributeId,
          valueId: data.valueId ?? null,
          customValue: data.customValue ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ),
    ),
  } as unknown as jest.Mocked<ProductAttributeRepositoryPort>;
  const productQuery = {
    exists: jest.fn().mockResolvedValue(productExists),
  } as unknown as jest.Mocked<ProductQueryPort>;
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };
  const cache = {
    invalidateDefaultFacets: jest.fn().mockResolvedValue(undefined),
  } as unknown as AttributeCacheService;

  return {
    useCase: new AssignAttributeToProductUseCase(
      attributes,
      productAttributes,
      productQuery,
      auditLog,
      cache,
    ),
    productAttributes,
  };
}

describe('AssignAttributeToProductUseCase', () => {
  it('rejects when the product does not exist', async () => {
    const { useCase } = buildUseCase(false);

    await expect(
      useCase.execute({
        productId: 'missing',
        attributeId: 'attr-1',
        valueId: 'val-1',
        actorUserId: 'staff-1',
        ipAddress: null,
      }),
    ).rejects.toBeInstanceOf(ProductNotFoundError);
  });

  it('rejects when the attribute does not exist', async () => {
    const { useCase } = buildUseCase(true, null);

    await expect(
      useCase.execute({
        productId: 'product-1',
        attributeId: 'missing',
        valueId: 'val-1',
        actorUserId: 'staff-1',
        ipAddress: null,
      }),
    ).rejects.toBeInstanceOf(AttributeNotFoundError);
  });

  it('rejects an invalid value for a LIST attribute', async () => {
    const { useCase } = buildUseCase();

    await expect(
      useCase.execute({
        productId: 'product-1',
        attributeId: 'attr-1',
        valueId: 'unknown-value',
        actorUserId: 'staff-1',
        ipAddress: null,
      }),
    ).rejects.toBeInstanceOf(InvalidAttributeAssignmentError);
  });

  it('assigns a valid value', async () => {
    const { useCase, productAttributes } = buildUseCase();

    await useCase.execute({
      productId: 'product-1',
      attributeId: 'attr-1',
      valueId: 'val-1',
      actorUserId: 'staff-1',
      ipAddress: null,
    });

    expect(productAttributes.upsert).toHaveBeenCalledWith('product-1', {
      attributeId: 'attr-1',
      valueId: 'val-1',
      customValue: null,
    });
  });
});
