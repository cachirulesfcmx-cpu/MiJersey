import { Inject, Injectable } from '@nestjs/common';

import type { SearchClickLogRepositoryPort } from '../../domain/ports/search-click-log.repository.port';
import type { SearchResultType } from '../../domain/value-objects/search-enums';
import { SEARCH_CLICK_LOG_REPOSITORY } from '../../search.constants';

export interface LogSearchClickInput {
  term: string;
  entityType: SearchResultType;
  entityId: string;
  sessionId?: string;
}

@Injectable()
export class LogSearchClickUseCase {
  constructor(
    @Inject(SEARCH_CLICK_LOG_REPOSITORY) private readonly clickLog: SearchClickLogRepositoryPort,
  ) {}

  execute(input: LogSearchClickInput): Promise<void> {
    return this.clickLog.record({ ...input, sessionId: input.sessionId ?? null });
  }
}
