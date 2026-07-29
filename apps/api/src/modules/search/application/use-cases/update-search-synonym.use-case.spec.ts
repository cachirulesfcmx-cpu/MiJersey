import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { SearchSynonymEntity } from '../../domain/entities/search-synonym.entity';
import {
  SearchSynonymAlreadyExistsError,
  SearchSynonymNotFoundError,
} from '../../domain/errors/search.errors';
import type { SearchSynonymRepositoryPort } from '../../domain/ports/search-synonym.repository.port';
import { UpdateSearchSynonymUseCase } from './update-search-synonym.use-case';

function buildEntity(term: string): SearchSynonymEntity {
  return new SearchSynonymEntity({
    id: 'synonym-1',
    term,
    synonyms: ['camiseta'],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildUseCase(
  existing: SearchSynonymEntity | null,
  clash: SearchSynonymEntity | null = null,
) {
  const synonyms: jest.Mocked<SearchSynonymRepositoryPort> = {
    findById: jest.fn().mockResolvedValue(existing),
    findByTerm: jest.fn().mockResolvedValue(clash),
    findMany: jest.fn(),
    findExpansions: jest.fn(),
    create: jest.fn(),
    update: jest.fn().mockImplementation((id, data) =>
      Promise.resolve(
        new SearchSynonymEntity({
          id,
          term: data.term ?? existing!.term,
          synonyms: data.synonyms ?? existing!.synonyms,
          createdAt: existing!.createdAt,
          updatedAt: new Date(),
        }),
      ),
    ),
    delete: jest.fn(),
  };
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  return { useCase: new UpdateSearchSynonymUseCase(synonyms, auditLog), synonyms, auditLog };
}

describe('UpdateSearchSynonymUseCase', () => {
  it('throws when the synonym group does not exist', async () => {
    const { useCase } = buildUseCase(null);

    await expect(
      useCase.execute({ id: 'missing', actorUserId: 'staff-1', ipAddress: null }),
    ).rejects.toBeInstanceOf(SearchSynonymNotFoundError);
  });

  it('throws when renaming to a term already used by another group', async () => {
    const { useCase } = buildUseCase(buildEntity('jersey'), buildEntity('camiseta'));

    await expect(
      useCase.execute({
        id: 'synonym-1',
        term: 'camiseta',
        actorUserId: 'staff-1',
        ipAddress: null,
      }),
    ).rejects.toBeInstanceOf(SearchSynonymAlreadyExistsError);
  });

  it('updates the synonym list, normalized and deduped', async () => {
    const { useCase, synonyms } = buildUseCase(buildEntity('jersey'));

    await useCase.execute({
      id: 'synonym-1',
      synonyms: ['Playera', 'playera', 'jersey'],
      actorUserId: 'staff-1',
      ipAddress: null,
    });

    expect(synonyms.update).toHaveBeenCalledWith('synonym-1', { synonyms: ['playera'] });
  });
});
