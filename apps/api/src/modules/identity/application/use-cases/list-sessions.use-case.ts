import { Inject, Injectable } from '@nestjs/common';

import type { SessionEntity } from '../../domain/entities/session.entity';
import type { SessionRepositoryPort } from '../../domain/ports/session.repository.port';
import { SESSION_REPOSITORY } from '../../identity.constants';

@Injectable()
export class ListSessionsUseCase {
  constructor(@Inject(SESSION_REPOSITORY) private readonly sessions: SessionRepositoryPort) {}

  execute(userId: string): Promise<SessionEntity[]> {
    return this.sessions.listActiveByUser(userId);
  }
}
