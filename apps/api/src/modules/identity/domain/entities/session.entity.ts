export type SessionStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED';

export interface SessionProps {
  id: string;
  userId: string;
  refreshTokenHash: string;
  userAgent: string | null;
  ipAddress: string | null;
  status: SessionStatus;
  createdAt: Date;
  lastUsedAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
}

export class SessionEntity {
  constructor(private readonly props: SessionProps) {}

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get refreshTokenHash(): string {
    return this.props.refreshTokenHash;
  }

  get status(): SessionStatus {
    return this.props.status;
  }

  get userAgent(): string | null {
    return this.props.userAgent;
  }

  get ipAddress(): string | null {
    return this.props.ipAddress;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get lastUsedAt(): Date {
    return this.props.lastUsedAt;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  isExpired(now: Date = new Date()): boolean {
    return now.getTime() >= this.props.expiresAt.getTime();
  }

  isUsable(now: Date = new Date()): boolean {
    return this.props.status === 'ACTIVE' && !this.isExpired(now);
  }
}
