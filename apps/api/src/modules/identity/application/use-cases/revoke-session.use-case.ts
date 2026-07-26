import { Inject, Injectable } from '@nestjs/common';

import { SessionNotFoundError } from '../../domain/errors/identity.errors';
import type { AuditLogRepositoryPort } from '../../domain/ports/audit-log.repository.port';
import type { SessionRepositoryPort } from '../../domain/ports/session.repository.port';
import { AUDIT_LOG_REPOSITORY, SESSION_REPOSITORY } from '../../identity.constants';

export interface RevokeSessionInput {
  sessionId: string;
  requestingUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class RevokeSessionUseCase {
  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessions: SessionRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: RevokeSessionInput): Promise<void> {
    const session = await this.sessions.findById(input.sessionId);

    if (!session || session.userId !== input.requestingUserId) {
      throw new SessionNotFoundError();
    }

    await this.sessions.revoke(session.id);
    await this.auditLog.record({
      userId: input.requestingUserId,
      action: 'auth.logout',
      ipAddress: input.ipAddress,
    });
  }
}
