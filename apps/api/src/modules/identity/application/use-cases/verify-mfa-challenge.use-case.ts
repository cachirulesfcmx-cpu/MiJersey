import { Inject, Injectable } from '@nestjs/common';

import type { UserEntity } from '../../domain/entities/user.entity';
import {
  InvalidMfaCodeError,
  MfaChallengeInvalidError,
  UserNotFoundError,
} from '../../domain/errors/identity.errors';
import type { AuditLogRepositoryPort } from '../../domain/ports/audit-log.repository.port';
import type { MfaChallengeStorePort } from '../../domain/ports/mfa-challenge-store.port';
import type { MfaSecretCipherPort } from '../../domain/ports/mfa-secret-cipher.port';
import type { TotpServicePort } from '../../domain/ports/totp.service.port';
import type { UserRepositoryPort } from '../../domain/ports/user.repository.port';
import {
  AUDIT_LOG_REPOSITORY,
  MFA_CHALLENGE_STORE,
  MFA_SECRET_CIPHER,
  TOTP_SERVICE,
  USER_REPOSITORY,
} from '../../identity.constants';
import { SessionIssuerService } from '../services/session-issuer.service';

export interface VerifyMfaChallengeInput {
  challengeToken: string;
  code: string;
  userAgent: string | null;
  ipAddress: string | null;
}

export interface VerifyMfaChallengeResult {
  user: UserEntity;
  accessToken: string;
  refreshToken: string;
}

/**
 * Segundo paso del login cuando el usuario tiene MFA activo (ver `LoginUseCase`).
 * El desafío es de un solo uso: `consume()` lo borra de Redis al leerlo, así
 * que un código correcto reenviado con el mismo `challengeToken` ya no sirve.
 */
@Injectable()
export class VerifyMfaChallengeUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(TOTP_SERVICE) private readonly totp: TotpServicePort,
    @Inject(MFA_SECRET_CIPHER) private readonly cipher: MfaSecretCipherPort,
    @Inject(MFA_CHALLENGE_STORE) private readonly challenges: MfaChallengeStorePort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
    private readonly sessionIssuer: SessionIssuerService,
  ) {}

  async execute(input: VerifyMfaChallengeInput): Promise<VerifyMfaChallengeResult> {
    const userId = await this.challenges.peek(input.challengeToken);
    if (!userId) throw new MfaChallengeInvalidError();

    const user = await this.users.findById(userId);
    if (!user || !user.mfaEnabled || !user.mfaSecret) throw new UserNotFoundError();

    const plainSecret = this.cipher.decrypt(user.mfaSecret);
    if (!this.totp.verifyCode(plainSecret, input.code)) {
      await this.auditLog.record({
        userId: user.id,
        action: 'auth.mfa.challenge_failed',
        ipAddress: input.ipAddress,
      });
      throw new InvalidMfaCodeError();
    }

    // Solo se invalida tras un código correcto: un típeo no debe forzar a
    // repetir el login completo, mientras el desafío siga vigente (TTL).
    await this.challenges.invalidate(input.challengeToken);

    const issued = await this.sessionIssuer.issue(user, {
      userAgent: input.userAgent,
      ipAddress: input.ipAddress,
    });

    await this.auditLog.record({
      userId: user.id,
      action: 'auth.login.success',
      ipAddress: input.ipAddress,
      metadata: { mfa: true },
    });

    return { user, accessToken: issued.accessToken, refreshToken: issued.refreshToken };
  }
}
