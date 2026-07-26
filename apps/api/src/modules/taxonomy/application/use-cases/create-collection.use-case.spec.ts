import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { CollectionEntity, type CollectionProps } from '../../domain/entities/collection.entity';
import {
  CollectionSlugAlreadyExistsError,
  InvalidCollectionOperationError,
} from '../../domain/errors/taxonomy.errors';
import type { CollectionRepositoryPort } from '../../domain/ports/collection.repository.port';
import {
  CollectionRuleField,
  CollectionRuleMatchType,
  CollectionRuleOperator,
  CollectionStatus,
  CollectionType,
} from '../../domain/value-objects/taxonomy-enums';
import { CreateCollectionUseCase } from './create-collection.use-case';

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

function buildUseCase(existsBySlug: boolean) {
  const repo: jest.Mocked<CollectionRepositoryPort> = {
    findById: jest.fn().mockResolvedValue(buildCollection()),
    findBySlug: jest.fn(),
    existsBySlug: jest.fn().mockResolvedValue(existsBySlug),
    create: jest.fn().mockResolvedValue(buildCollection()),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
    findManyPublic: jest.fn(),
    replaceRules: jest.fn().mockResolvedValue(undefined),
    addProducts: jest.fn(),
    removeProduct: jest.fn(),
    reorderProducts: jest.fn(),
    listManualProductIds: jest.fn(),
  };
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  return { useCase: new CreateCollectionUseCase(repo, auditLog), repo };
}

describe('CreateCollectionUseCase', () => {
  it('rejects rules on a manual collection', async () => {
    const { useCase } = buildUseCase(false);

    await expect(
      useCase.execute({
        name: 'Novedades',
        type: CollectionType.MANUAL,
        rules: [
          { field: CollectionRuleField.SKU, operator: CollectionRuleOperator.CONTAINS, value: 'X' },
        ],
        actorUserId: 'staff-1',
        ipAddress: null,
      }),
    ).rejects.toBeInstanceOf(InvalidCollectionOperationError);
  });

  it('rejects a duplicate slug', async () => {
    const { useCase } = buildUseCase(true);

    await expect(
      useCase.execute({
        name: 'Novedades',
        type: CollectionType.MANUAL,
        actorUserId: 'staff-1',
        ipAddress: null,
      }),
    ).rejects.toBeInstanceOf(CollectionSlugAlreadyExistsError);
  });

  it('saves rules for a smart collection', async () => {
    const { useCase, repo } = buildUseCase(false);
    const rules = [
      {
        field: CollectionRuleField.SKU,
        operator: CollectionRuleOperator.CONTAINS,
        value: 'JERSEY',
      },
    ];

    await useCase.execute({
      name: 'Jerseys',
      type: CollectionType.SMART,
      rules,
      actorUserId: 'staff-1',
      ipAddress: null,
    });

    expect(repo.replaceRules).toHaveBeenCalledWith(
      'collection-1',
      CollectionRuleMatchType.ALL,
      rules,
    );
  });
});
