import { Inject, Injectable } from '@nestjs/common';

import {
  InvalidMfaCodeError,
  MfaNotEnabledError,
  UserNotFoundError,
} from '../../domain/errors/identity.errors';
import type { AuditLogRepositoryPort } from '../../domain/ports/audit-log.repository.port';
import type { MfaSecretCipherPort } from '../../domain/ports/mfa-secret-cipher.port';
import type { TotpServicePort } from '../../domain/ports/totp.service.port';
import type { UserRepositoryPort } from '../../domain/ports/user.repository.port';
import {
  AUDIT_LOG_REPOSITORY,
  MFA_SECRET_CIPHER,
  TOTP_SERVICE,
  USER_REPOSITORY,
} from '../../identity.constants';

export interface DisableMfaInput {
  userId: string;
  code: string;
  ipAddress: string | null;
}

/** Exige un código TOTP vigente (no solo un botón) para desactivar — quien apaga MFA debe demostrar que aún controla el segundo factor. */
@Injectable()
export class DisableMfaUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(TOTP_SERVICE) private readonly totp: TotpServicePort,
    @Inject(MFA_SECRET_CIPHER) private readonly cipher: MfaSecretCipherPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: DisableMfaInput): Promise<void> {
    const user = await this.users.findById(input.userId);
    if (!user) throw new UserNotFoundError();
    if (!user.mfaEnabled || !user.mfaSecret) throw new MfaNotEnabledError();

    const plainSecret = this.cipher.decrypt(user.mfaSecret);
    if (!this.totp.verifyCode(plainSecret, input.code)) {
      throw new InvalidMfaCodeError();
    }

    await this.users.updateMfa(input.userId, {
      mfaSecret: null,
      mfaEnabled: false,
      mfaEnabledAt: null,
    });

    await this.auditLog.record({
      userId: input.userId,
      action: 'auth.mfa.disabled',
      ipAddress: input.ipAddress,
    });
  }
}
