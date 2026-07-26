import { Inject, Injectable } from '@nestjs/common';

import {
  TokenAlreadyUsedError,
  TokenExpiredError,
  TokenInvalidError,
} from '../../domain/errors/identity.errors';
import type { AuditLogRepositoryPort } from '../../domain/ports/audit-log.repository.port';
import type { EmailVerificationRepositoryPort } from '../../domain/ports/email-verification.repository.port';
import type { TokenServicePort } from '../../domain/ports/token.service.port';
import type { UserRepositoryPort } from '../../domain/ports/user.repository.port';
import {
  AUDIT_LOG_REPOSITORY,
  EMAIL_VERIFICATION_REPOSITORY,
  TOKEN_SERVICE,
  USER_REPOSITORY,
} from '../../identity.constants';

@Injectable()
export class VerifyEmailUseCase {
  constructor(
    @Inject(EMAIL_VERIFICATION_REPOSITORY)
    private readonly verifications: EmailVerificationRepositoryPort,
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenServicePort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(rawToken: string): Promise<void> {
    const tokenHash = this.tokens.hashOpaqueToken(rawToken);
    const record = await this.verifications.findByTokenHash(tokenHash);

    if (!record) {
      throw new TokenInvalidError();
    }
    if (record.usedAt) {
      throw new TokenAlreadyUsedError();
    }
    if (record.expiresAt.getTime() < Date.now()) {
      throw new TokenExpiredError();
    }

    await this.users.markEmailVerified(record.userId);
    await this.verifications.markUsed(record.id);
    await this.auditLog.record({
      userId: record.userId,
      action: 'auth.email_verified',
      ipAddress: null,
    });
  }
}
