import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';

import { APP_CONFIG } from '../../../../config/env.config';
import type { AppConfig } from '../../../../config/env.schema';
import type { MfaSecretCipherPort } from '../../domain/ports/mfa-secret-cipher.port';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_BYTES = 12;

/**
 * AES-256-GCM con clave derivada por SHA-256 de `MFA_ENCRYPTION_KEY` (así
 * cualquier string sirve como clave sin exigir base64 de 32 bytes exactos).
 * Formato de salida: `iv:authTag:cipherText`, cada segmento en base64.
 */
@Injectable()
export class AesGcmMfaSecretCipher implements MfaSecretCipherPort {
  private readonly key: Buffer;

  constructor(@Inject(APP_CONFIG) config: AppConfig) {
    this.key = createHash('sha256').update(config.mfaEncryptionKey).digest();
  }

  encrypt(plainSecret: string): string {
    const iv = randomBytes(IV_LENGTH_BYTES);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const cipherText = Buffer.concat([cipher.update(plainSecret, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return [iv.toString('base64'), authTag.toString('base64'), cipherText.toString('base64')].join(
      ':',
    );
  }

  decrypt(cipherText: string): string {
    const [ivB64, authTagB64, dataB64] = cipherText.split(':');
    if (!ivB64 || !authTagB64 || !dataB64) {
      throw new Error('Formato de secreto MFA cifrado inválido');
    }

    const decipher = createDecipheriv(ALGORITHM, this.key, Buffer.from(ivB64, 'base64'));
    decipher.setAuthTag(Buffer.from(authTagB64, 'base64'));

    return Buffer.concat([
      decipher.update(Buffer.from(dataB64, 'base64')),
      decipher.final(),
    ]).toString('utf8');
  }
}
