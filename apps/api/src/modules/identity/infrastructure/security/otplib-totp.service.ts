import { Injectable } from '@nestjs/common';
import { OTP } from 'otplib';

import type { TotpServicePort } from '../../domain/ports/totp.service.port';

const MFA_ISSUER = 'MiJersey';
/** ±30s de desfase de reloj del dispositivo del usuario — la tolerancia estándar recomendada. */
const EPOCH_TOLERANCE_SECONDS = 30;

/** RFC 6238 (TOTP) vía otplib v13 (`OTP` con `verifySync`, soportado por el plugin de cripto por defecto — Noble). */
@Injectable()
export class OtplibTotpService implements TotpServicePort {
  private readonly otp = new OTP({ strategy: 'totp' });

  generateSecret(): string {
    return this.otp.generateSecret();
  }

  buildOtpauthUrl(secret: string, accountLabel: string): string {
    return this.otp.generateURI({ issuer: MFA_ISSUER, label: accountLabel, secret });
  }

  verifyCode(secret: string, code: string): boolean {
    try {
      const result = this.otp.verifySync({
        secret,
        token: code,
        epochTolerance: EPOCH_TOLERANCE_SECONDS,
      });
      return result.valid;
    } catch {
      return false;
    }
  }
}
