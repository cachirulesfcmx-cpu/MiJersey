/** Cifra/descifra el secreto TOTP antes de tocar la base de datos — nunca se persiste en claro (035 §3 "cifrado de datos sensibles"). */
export interface MfaSecretCipherPort {
  encrypt(plainSecret: string): string;
  decrypt(cipherText: string): string;
}
