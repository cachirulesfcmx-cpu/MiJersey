import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { SearchSynonymEntity } from '../../domain/entities/search-synonym.entity';
import {
  SearchSynonymAlreadyExistsError,
  SearchSynonymNotFoundError,
} from '../../domain/errors/search.errors';
import type { SearchSynonymRepositoryPort } from '../../domain/ports/search-synonym.repository.port';
import { SEARCH_SYNONYM_REPOSITORY } from '../../search.constants';

export interface UpdateSearchSynonymInput {
  id: string;
  term?: string;
  synonyms?: string[];
  actorUserId: string;
  ipAddress: string | null;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

@Injectable()
export class UpdateSearchSynonymUseCase {
  constructor(
    @Inject(SEARCH_SYNONYM_REPOSITORY) private readonly synonyms: SearchSynonymRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: UpdateSearchSynonymInput): Promise<SearchSynonymEntity> {
    const existing = await this.synonyms.findById(input.id);
    if (!existing) throw new SearchSynonymNotFoundError();

    const term = input.term !== undefined ? normalize(input.term) : undefined;
    if (term && term !== existing.term) {
      const clash = await this.synonyms.findByTerm(term);
      if (clash) throw new SearchSynonymAlreadyExistsError();
    }

    const synonymList =
      input.synonyms !== undefined
        ? [
            ...new Set(
              input.synonyms
                .map(normalize)
                .filter((value) => value.length > 0 && value !== (term ?? existing.term)),
            ),
          ]
        : undefined;

    const updated = await this.synonyms.update(input.id, {
      ...(term ? { term } : {}),
      ...(synonymList ? { synonyms: synonymList } : {}),
    });

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'search.synonym.updated',
      ipAddress: input.ipAddress,
      metadata: { synonymId: updated.id, term: updated.term },
    });

    return updated;
  }
}
