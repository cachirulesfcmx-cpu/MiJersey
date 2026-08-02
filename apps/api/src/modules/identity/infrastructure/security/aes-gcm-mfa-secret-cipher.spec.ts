import type { AppConfig } from '../../../../config/env.schema';
import { AesGcmMfaSecretCipher } from './aes-gcm-mfa-secret-cipher';

function buildCipher(key = 'test-mfa-key'): AesGcmMfaSecretCipher {
  return new AesGcmMfaSecretCipher({ mfaEncryptionKey: key } as AppConfig);
}

describe('AesGcmMfaSecretCipher', () => {
  it('round-trips a secret through encrypt/decrypt', () => {
    const cipher = buildCipher();
    const cipherText = cipher.encrypt('JBSWY3DPEHPK3PXP');

    expect(cipherText).not.toContain('JBSWY3DPEHPK3PXP');
    expect(cipher.decrypt(cipherText)).toBe('JBSWY3DPEHPK3PXP');
  });

  it('produces a different ciphertext each time (random IV)', () => {
    const cipher = buildCipher();
    const a = cipher.encrypt('same-secret');
    const b = cipher.encrypt('same-secret');

    expect(a).not.toBe(b);
  });

  it('fails to decrypt with the wrong key', () => {
    const cipherText = buildCipher('key-a').encrypt('a-secret');

    expect(() => buildCipher('key-b').decrypt(cipherText)).toThrow();
  });
});
