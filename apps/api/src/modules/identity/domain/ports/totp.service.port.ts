export interface TotpServicePort {
  generateSecret(): string;
  buildOtpauthUrl(secret: string, accountLabel: string): string;
  verifyCode(secret: string, code: string): boolean;
}
