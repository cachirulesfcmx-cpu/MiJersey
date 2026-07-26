import { Inject, Injectable } from '@nestjs/common';

import { InvalidCredentialsError, UserNotFoundError } from '../../domain/errors/identity.errors';
import type { AuditLogRepositoryPort } from '../../domain/ports/audit-log.repository.port';
import type { PasswordHasherPort } from '../../domain/ports/password-hasher.port';
import type { SessionRepositoryPort } from '../../domain/ports/session.repository.port';
import type { UserRepositoryPort } from '../../domain/ports/user.repository.port';
import {
  AUDIT_LOG_REPOSITORY,
  PASSWORD_HASHER,
  SESSION_REPOSITORY,
  USER_REPOSITORY,
} from '../../identity.constants';

export interface ChangePasswordInput {
  userId: string;
  currentPassword: string;
  newPassword: string;
  currentSessionId: string;
  ipAddress: string | null;
}

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasherPort,
    @Inject(SESSION_REPOSITORY) private readonly sessions: SessionRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: ChangePasswordInput): Promise<void> {
    const user = await this.users.findById(input.userId);

    if (!user) {
      throw new UserNotFoundError();
    }

    const isValid = await this.hasher.compare(input.currentPassword, user.passwordHash);

    if (!isValid) {
      throw new InvalidCredentialsError();
    }

    const passwordHash = await this.hasher.hash(input.newPassword);
    await this.users.updatePassword(user.id, passwordHash);
    // Se conserva la sesión actual; se cierran las demás por seguridad.
    await this.sessions.revokeAllForUser(user.id, input.currentSessionId);

    await this.auditLog.record({
      userId: user.id,
      action: 'auth.password_changed',
      ipAddress: input.ipAddress,
    });
  }
}
