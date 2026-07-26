import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../domain/ports/audit-log.repository.port';
import type { SessionRepositoryPort } from '../../domain/ports/session.repository.port';
import { AUDIT_LOG_REPOSITORY, SESSION_REPOSITORY } from '../../identity.constants';

export interface RevokeAllSessionsInput {
  userId: string;
  exceptSessionId?: string;
  ipAddress: string | null;
}

@Injectable()
export class RevokeAllSessionsUseCase {
  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessions: SessionRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: RevokeAllSessionsInput): Promise<void> {
    await this.sessions.revokeAllForUser(input.userId, input.exceptSessionId);
    await this.auditLog.record({
      userId: input.userId,
      action: 'auth.logout_all',
      ipAddress: input.ipAddress,
    });
  }
}
