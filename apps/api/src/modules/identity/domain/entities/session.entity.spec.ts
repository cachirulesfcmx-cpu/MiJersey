import { SessionEntity, type SessionStatus } from './session.entity';

function buildSession(
  overrides: Partial<{ status: SessionStatus; expiresAt: Date }> = {},
): SessionEntity {
  return new SessionEntity({
    id: 'session-1',
    userId: 'user-1',
    refreshTokenHash: 'hash',
    userAgent: null,
    ipAddress: null,
    status: overrides.status ?? 'ACTIVE',
    createdAt: new Date(),
    lastUsedAt: new Date(),
    expiresAt: overrides.expiresAt ?? new Date(Date.now() + 60_000),
    revokedAt: null,
  });
}

describe('SessionEntity', () => {
  it('is usable when active and not expired', () => {
    expect(buildSession().isUsable()).toBe(true);
  });

  it('is not usable when revoked', () => {
    expect(buildSession({ status: 'REVOKED' }).isUsable()).toBe(false);
  });

  it('is not usable when expired', () => {
    expect(buildSession({ expiresAt: new Date(Date.now() - 1000) }).isUsable()).toBe(false);
  });
});
