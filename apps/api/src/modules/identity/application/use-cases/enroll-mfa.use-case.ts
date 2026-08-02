import { Inject, Injectable } from '@nestjs/common';

import { MfaNotApplicableError, UserNotFoundError } from '../../domain/errors/identity.errors';
import type { MfaSecretCipherPort } from '../../domain/ports/mfa-secret-cipher.port';
import type { TotpServicePort } from '../../domain/ports/totp.service.port';
import type { UserRepositoryPort } from '../../domain/ports/user.repository.port';
import { MFA_SECRET_CIPHER, TOTP_SERVICE, USER_REPOSITORY } from '../../identity.constants';
import { generateMfaQrCode } from '../../infrastructure/security/generate-mfa-qr-code';

export interface EnrollMfaResult {
  secret: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
}

/**
 * Genera un nuevo secreto TOTP "pendiente" (mfaEnabled sigue en `false` hasta
 * `ConfirmMfaUseCase`) — enrolar de nuevo antes de confirmar simplemente
 * reemplaza el secreto pendiente anterior, no hay estado a limpiar.
 */
@Injectable()
export class EnrollMfaUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(TOTP_SERVICE) private readonly totp: TotpServicePort,
    @Inject(MFA_SECRET_CIPHER) private readonly cipher: MfaSecretCipherPort,
  ) {}

  async execute(userId: string): Promise<EnrollMfaResult> {
    const user = await this.users.findById(userId);
    if (!user) throw new UserNotFoundError();
    if (!user.canUseMfa()) throw new MfaNotApplicableError();

    const secret = this.totp.generateSecret();
    const otpauthUrl = this.totp.buildOtpauthUrl(secret, user.email);

    await this.users.updateMfa(userId, {
      mfaSecret: this.cipher.encrypt(secret),
      mfaEnabled: false,
      mfaEnabledAt: null,
    });

    return { secret, otpauthUrl, qrCodeDataUrl: await generateMfaQrCode(otpauthUrl) };
  }
}
