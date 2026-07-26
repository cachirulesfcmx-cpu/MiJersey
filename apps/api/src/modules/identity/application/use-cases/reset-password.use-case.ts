import { Inject, Injectable } from '@nestjs/common';

import {
  TokenAlreadyUsedError,
  TokenExpiredError,
  TokenInvalidError,
} from '../../domain/errors/identity.errors';
import type { AuditLogRepositoryPort } from '../../domain/ports/audit-log.repository.port';
import type { PasswordHasherPort } from '../../domain/ports/password-hasher.port';
import type { PasswordResetRepositoryPort } from '../../domain/ports/password-reset.repository.port';
import type { SessionRepositoryPort } from '../../domain/ports/session.repository.port';
import type { TokenServicePort } from '../../domain/ports/token.service.port';
import type { UserRepositoryPort } from '../../domain/ports/user.repository.port';
import {
  AUDIT_LOG_REPOSITORY,
  PASSWORD_HASHER,
  PASSWORD_RESET_REPOSITORY,
  SESSION_REPOSITORY,
  TOKEN_SERVICE,
  USER_REPOSITORY,
} from '../../identity.constants';

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
  ipAddress: string | null;
}

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(PASSWORD_RESET_REPOSITORY) private readonly passwordResets: PasswordResetRepositoryPort,
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasherPort,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenServicePort,
    @Inject(SESSION_REPOSITORY) private readonly sessions: SessionRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: ResetPasswordInput): Promise<void> {
    const tokenHash = this.tokens.hashOpaqueToken(input.token);
    const record = await this.passwordResets.findByTokenHash(tokenHash);

    if (!record) {
      throw new TokenInvalidError();
    }
    if (record.usedAt) {
      throw new TokenAlreadyUsedError();
    }
    if (record.expiresAt.getTime() < Date.now()) {
      throw new TokenExpiredError();
    }

    const passwordHash = await this.hasher.hash(input.newPassword);
    await this.users.updatePassword(record.userId, passwordHash);
    await this.passwordResets.markUsed(record.id);
    // La contraseña cambió: se invalidan todas las sesiones activas (§7).
    await this.sessions.revokeAllForUser(record.userId);

    await this.auditLog.record({
      userId: record.userId,
      action: 'auth.password_reset',
      ipAddress: input.ipAddress,
    });
  }
}
