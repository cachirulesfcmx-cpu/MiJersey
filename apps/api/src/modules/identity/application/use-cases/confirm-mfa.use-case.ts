import { Inject, Injectable } from '@nestjs/common';

import {
  InvalidMfaCodeError,
  MfaAlreadyEnabledError,
  MfaNotEnrolledError,
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

export interface ConfirmMfaInput {
  userId: string;
  code: string;
  ipAddress: string | null;
}

/** Confirma el enrolamiento probando que el usuario ya puede generar códigos válidos, antes de activarlo de verdad. */
@Injectable()
export class ConfirmMfaUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(TOTP_SERVICE) private readonly totp: TotpServicePort,
    @Inject(MFA_SECRET_CIPHER) private readonly cipher: MfaSecretCipherPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: ConfirmMfaInput): Promise<void> {
    const user = await this.users.findById(input.userId);
    if (!user) throw new UserNotFoundError();
    if (user.mfaEnabled) throw new MfaAlreadyEnabledError();
    if (!user.mfaSecret) throw new MfaNotEnrolledError();

    const plainSecret = this.cipher.decrypt(user.mfaSecret);
    if (!this.totp.verifyCode(plainSecret, input.code)) {
      throw new InvalidMfaCodeError();
    }

    await this.users.updateMfa(input.userId, {
      mfaSecret: user.mfaSecret,
      mfaEnabled: true,
      mfaEnabledAt: new Date(),
    });

    await this.auditLog.record({
      userId: input.userId,
      action: 'auth.mfa.enabled',
      ipAddress: input.ipAddress,
    });
  }
}
