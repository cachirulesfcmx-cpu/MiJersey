import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { SearchSynonymEntity } from '../../domain/entities/search-synonym.entity';
import { SearchSynonymAlreadyExistsError } from '../../domain/errors/search.errors';
import type { SearchSynonymRepositoryPort } from '../../domain/ports/search-synonym.repository.port';
import { CreateSearchSynonymUseCase } from './create-search-synonym.use-case';

function buildUseCase(existing: SearchSynonymEntity | null) {
  const synonyms: jest.Mocked<SearchSynonymRepositoryPort> = {
    findById: jest.fn(),
    findByTerm: jest.fn().mockResolvedValue(existing),
    findMany: jest.fn(),
    findExpansions: jest.fn(),
    create: jest.fn().mockImplementation((data) =>
      Promise.resolve(
        new SearchSynonymEntity({
          id: 'synonym-1',
          term: data.term,
          synonyms: data.synonyms,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ),
    ),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  return { useCase: new CreateSearchSynonymUseCase(synonyms, auditLog), synonyms, auditLog };
}

describe('CreateSearchSynonymUseCase', () => {
  it('throws when a synonym group already exists for the term', async () => {
    const { useCase } = buildUseCase(
      new SearchSynonymEntity({
        id: 'existing',
        term: 'jersey',
        synonyms: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    await expect(
      useCase.execute({ term: 'Jersey', synonyms: [], actorUserId: 'staff-1', ipAddress: null }),
    ).rejects.toBeInstanceOf(SearchSynonymAlreadyExistsError);
  });

  it('normalizes term and synonyms to lowercase, deduped, and excluding the term itself', async () => {
    const { useCase, synonyms, auditLog } = buildUseCase(null);

    const result = await useCase.execute({
      term: '  Jersey  ',
      synonyms: ['Camiseta', 'CAMISETA', 'jersey', ''],
      actorUserId: 'staff-1',
      ipAddress: '127.0.0.1',
    });

    expect(synonyms.create).toHaveBeenCalledWith({ term: 'jersey', synonyms: ['camiseta'] });
    expect(result.term).toBe('jersey');
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'search.synonym.created' }),
    );
  });
});
