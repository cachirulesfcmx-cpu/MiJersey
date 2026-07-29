import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { SearchSynonymEntity } from '../../domain/entities/search-synonym.entity';
import { SearchSynonymAlreadyExistsError } from '../../domain/errors/search.errors';
import type { SearchSynonymRepositoryPort } from '../../domain/ports/search-synonym.repository.port';
import { SEARCH_SYNONYM_REPOSITORY } from '../../search.constants';

export interface CreateSearchSynonymInput {
  term: string;
  synonyms: string[];
  actorUserId: string;
  ipAddress: string | null;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

@Injectable()
export class CreateSearchSynonymUseCase {
  constructor(
    @Inject(SEARCH_SYNONYM_REPOSITORY) private readonly synonyms: SearchSynonymRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: CreateSearchSynonymInput): Promise<SearchSynonymEntity> {
    const term = normalize(input.term);
    const existing = await this.synonyms.findByTerm(term);
    if (existing) throw new SearchSynonymAlreadyExistsError();

    const normalizedSynonyms = [
      ...new Set(
        input.synonyms.map(normalize).filter((value) => value.length > 0 && value !== term),
      ),
    ];

    const created = await this.synonyms.create({ term, synonyms: normalizedSynonyms });

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'search.synonym.created',
      ipAddress: input.ipAddress,
      metadata: { synonymId: created.id, term: created.term },
    });

    return created;
  }
}
