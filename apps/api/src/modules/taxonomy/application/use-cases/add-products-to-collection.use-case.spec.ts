import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { CollectionEntity, type CollectionProps } from '../../domain/entities/collection.entity';
import {
  InvalidCollectionOperationError,
  ProductNotFoundError,
} from '../../domain/errors/taxonomy.errors';
import type { CollectionRepositoryPort } from '../../domain/ports/collection.repository.port';
import type { ProductQueryPort, ProductSummary } from '../../domain/ports/product-query.port';
import {
  CollectionRuleMatchType,
  CollectionStatus,
  CollectionType,
} from '../../domain/value-objects/taxonomy-enums';
import { TaxonomyCacheService } from '../services/taxonomy-cache.service';
import { AddProductsToCollectionUseCase } from './add-products-to-collection.use-case';

function buildCollection(overrides: Partial<CollectionProps> = {}): CollectionEntity {
  return new CollectionEntity({
    id: 'collection-1',
    slug: 'collection-1',
    name: 'Collection 1',
    description: null,
    type: CollectionType.MANUAL,
    status: CollectionStatus.ACTIVE,
    matchType: CollectionRuleMatchType.ALL,
    rules: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

function buildProduct(id: string): ProductSummary {
  return {
    id,
    sku: id.toUpperCase(),
    slug: id,
    name: id,
    type: 'PHYSICAL',
    status: 'ACTIVE',
    visibility: 'PUBLIC',
  };
}

function buildUseCase(collection: CollectionEntity | null, foundProductIds: string[]) {
  const collections = {
    findById: jest.fn().mockResolvedValue(collection),
    addProducts: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<CollectionRepositoryPort>;
  const products = {
    findByIds: jest.fn((ids: string[]) =>
      Promise.resolve(ids.filter((id) => foundProductIds.includes(id)).map(buildProduct)),
    ),
  } as unknown as jest.Mocked<ProductQueryPort>;
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };
  const cache = {
    invalidateCollectionsList: jest.fn().mockResolvedValue(undefined),
  } as unknown as TaxonomyCacheService;

  return {
    useCase: new AddProductsToCollectionUseCase(collections, products, auditLog, cache),
    collections,
  };
}

describe('AddProductsToCollectionUseCase', () => {
  it('rejects adding products to a smart collection', async () => {
    const { useCase } = buildUseCase(buildCollection({ type: CollectionType.SMART }), [
      'product-1',
    ]);

    await expect(
      useCase.execute({
        collectionId: 'collection-1',
        productIds: ['product-1'],
        actorUserId: 'staff-1',
        ipAddress: null,
      }),
    ).rejects.toBeInstanceOf(InvalidCollectionOperationError);
  });

  it('rejects a product id that does not exist', async () => {
    const { useCase } = buildUseCase(buildCollection(), ['product-1']);

    await expect(
      useCase.execute({
        collectionId: 'collection-1',
        productIds: ['product-1', 'ghost'],
        actorUserId: 'staff-1',
        ipAddress: null,
      }),
    ).rejects.toBeInstanceOf(ProductNotFoundError);
  });

  it('adds valid products to a manual collection', async () => {
    const { useCase, collections } = buildUseCase(buildCollection(), ['product-1', 'product-2']);

    await useCase.execute({
      collectionId: 'collection-1',
      productIds: ['product-1', 'product-2'],
      actorUserId: 'staff-1',
      ipAddress: null,
    });

    expect(collections.addProducts).toHaveBeenCalledWith('collection-1', [
      'product-1',
      'product-2',
    ]);
  });
});
