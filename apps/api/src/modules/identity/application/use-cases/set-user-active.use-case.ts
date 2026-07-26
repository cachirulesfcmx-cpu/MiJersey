import { Inject, Injectable } from '@nestjs/common';

import { CannotModifySelfError, UserNotFoundError } from '../../domain/errors/identity.errors';
import type { AuditLogRepositoryPort } from '../../domain/ports/audit-log.repository.port';
import type { SessionRepositoryPort } from '../../domain/ports/session.repository.port';
import type { UserRepositoryPort } from '../../domain/ports/user.repository.port';
import {
  AUDIT_LOG_REPOSITORY,
  SESSION_REPOSITORY,
  USER_REPOSITORY,
} from '../../identity.constants';

export interface SetUserActiveInput {
  targetUserId: string;
  isActive: boolean;
  requestingUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class SetUserActiveUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(SESSION_REPOSITORY) private readonly sessions: SessionRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: SetUserActiveInput): Promise<void> {
    if (input.targetUserId === input.requestingUserId) {
      throw new CannotModifySelfError();
    }

    const target = await this.users.findById(input.targetUserId);

    if (!target) {
      throw new UserNotFoundError();
    }

    await this.users.setActive(input.targetUserId, input.isActive);

    if (!input.isActive) {
      await this.sessions.revokeAllForUser(input.targetUserId);
    }

    await this.auditLog.record({
      userId: input.requestingUserId,
      action: input.isActive ? 'admin.user.activated' : 'admin.user.deactivated',
      ipAddress: input.ipAddress,
      metadata: { targetUserId: input.targetUserId },
    });
  }
}
