import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { SearchSynonymEntity } from '../../domain/entities/search-synonym.entity';
import { SearchSynonymNotFoundError } from '../../domain/errors/search.errors';
import type { SearchSynonymRepositoryPort } from '../../domain/ports/search-synonym.repository.port';
import { DeleteSearchSynonymUseCase } from './delete-search-synonym.use-case';

function buildUseCase(existing: SearchSynonymEntity | null) {
  const synonyms: jest.Mocked<SearchSynonymRepositoryPort> = {
    findById: jest.fn().mockResolvedValue(existing),
    findByTerm: jest.fn(),
    findMany: jest.fn(),
    findExpansions: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn().mockResolvedValue(undefined),
  };
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  return { useCase: new DeleteSearchSynonymUseCase(synonyms, auditLog), synonyms, auditLog };
}

describe('DeleteSearchSynonymUseCase', () => {
  it('throws when the synonym group does not exist', async () => {
    const { useCase } = buildUseCase(null);

    await expect(
      useCase.execute({ id: 'missing', actorUserId: 'staff-1', ipAddress: null }),
    ).rejects.toBeInstanceOf(SearchSynonymNotFoundError);
  });

  it('deletes the group and records an audit log entry', async () => {
    const existing = new SearchSynonymEntity({
      id: 'synonym-1',
      term: 'jersey',
      synonyms: ['camiseta'],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const { useCase, synonyms, auditLog } = buildUseCase(existing);

    await useCase.execute({ id: 'synonym-1', actorUserId: 'staff-1', ipAddress: '127.0.0.1' });

    expect(synonyms.delete).toHaveBeenCalledWith('synonym-1');
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'search.synonym.deleted', userId: 'staff-1' }),
    );
  });
});
