export interface EmailVerificationTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
}

export interface EmailVerificationRepositoryPort {
  create(userId: string, tokenHash: string, expiresAt: Date): Promise<EmailVerificationTokenRecord>;
  findByTokenHash(tokenHash: string): Promise<EmailVerificationTokenRecord | null>;
  markUsed(id: string): Promise<void>;
  invalidateAllForUser(userId: string): Promise<void>;
}
