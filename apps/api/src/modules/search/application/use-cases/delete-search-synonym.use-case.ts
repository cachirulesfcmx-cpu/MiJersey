import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { SearchSynonymNotFoundError } from '../../domain/errors/search.errors';
import type { SearchSynonymRepositoryPort } from '../../domain/ports/search-synonym.repository.port';
import { SEARCH_SYNONYM_REPOSITORY } from '../../search.constants';

export interface DeleteSearchSynonymInput {
  id: string;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class DeleteSearchSynonymUseCase {
  constructor(
    @Inject(SEARCH_SYNONYM_REPOSITORY) private readonly synonyms: SearchSynonymRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: DeleteSearchSynonymInput): Promise<void> {
    const existing = await this.synonyms.findById(input.id);
    if (!existing) throw new SearchSynonymNotFoundError();

    await this.synonyms.delete(input.id);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'search.synonym.deleted',
      ipAddress: input.ipAddress,
      metadata: { synonymId: input.id, term: existing.term },
    });
  }
}
