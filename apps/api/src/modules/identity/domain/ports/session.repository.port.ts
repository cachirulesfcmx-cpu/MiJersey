import type { SessionEntity } from '../entities/session.entity';

export interface CreateSessionData {
  userId: string;
  refreshTokenHash: string;
  userAgent: string | null;
  ipAddress: string | null;
  expiresAt: Date;
}

export interface SessionRepositoryPort {
  create(data: CreateSessionData): Promise<SessionEntity>;
  findByRefreshTokenHash(hash: string): Promise<SessionEntity | null>;
  findById(id: string): Promise<SessionEntity | null>;
  listActiveByUser(userId: string): Promise<SessionEntity[]>;
  rotate(id: string, newRefreshTokenHash: string, newExpiresAt: Date): Promise<void>;
  revoke(id: string): Promise<void>;
  revokeAllForUser(userId: string, exceptId?: string): Promise<void>;
}
