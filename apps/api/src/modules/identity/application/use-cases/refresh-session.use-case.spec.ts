import { SessionEntity, type SessionStatus } from '../../domain/entities/session.entity';
import { UserEntity } from '../../domain/entities/user.entity';
import { SessionNotFoundError } from '../../domain/errors/identity.errors';
import type { SessionRepositoryPort } from '../../domain/ports/session.repository.port';
import type { TokenServicePort } from '../../domain/ports/token.service.port';
import type { UserRepositoryPort } from '../../domain/ports/user.repository.port';
import { RoleName } from '../../domain/value-objects/role-name';
import type { SessionIssuerService } from '../services/session-issuer.service';
import { RefreshSessionUseCase } from './refresh-session.use-case';

function buildSession(
  overrides: Partial<{ status: SessionStatus; expiresAt: Date }> = {},
): SessionEntity {
  return new SessionEntity({
    id: 'session-1',
    userId: 'user-1',
    refreshTokenHash: 'hashed-token',
    userAgent: null,
    ipAddress: null,
    status: overrides.status ?? 'ACTIVE',
    createdAt: new Date(),
    lastUsedAt: new Date(),
    expiresAt: overrides.expiresAt ?? new Date(Date.now() + 60 * 60 * 1000),
    revokedAt: null,
  });
}

function buildUser(): UserEntity {
  return new UserEntity({
    id: 'user-1',
    email: 'customer@example.com',
    passwordHash: 'hash',
    firstName: 'Ada',
    lastName: 'Lovelace',
    role: RoleName.CUSTOMER,
    emailVerifiedAt: new Date(),
    isActive: true,
    mfaSecret: null,
    mfaEnabled: false,
    createdAt: new Date(),
  });
}

function buildUseCase(session: SessionEntity | null, user: UserEntity | null) {
  const sessions: jest.Mocked<SessionRepositoryPort> = {
    create: jest.fn(),
    findByRefreshTokenHash: jest.fn().mockResolvedValue(session),
    findById: jest.fn(),
    listActiveByUser: jest.fn(),
    rotate: jest.fn(),
    revoke: jest.fn(),
    revokeAllForUser: jest.fn(),
  };
  const users: jest.Mocked<UserRepositoryPort> = {
    findById: jest.fn().mockResolvedValue(user),
    findByEmail: jest.fn(),
    create: jest.fn(),
    updatePassword: jest.fn(),
    markEmailVerified: jest.fn(),
    updateProfile: jest.fn(),
    updateRole: jest.fn(),
    setActive: jest.fn(),
    updateMfa: jest.fn(),
    findMany: jest.fn(),
  };
  const tokens: jest.Mocked<TokenServicePort> = {
    signAccessToken: jest.fn(),
    verifyAccessToken: jest.fn(),
    generateOpaqueToken: jest.fn(),
    hashOpaqueToken: jest.fn().mockReturnValue('hashed-token'),
  };
  const sessionIssuer = {
    issue: jest.fn(),
    rotate: jest.fn().mockResolvedValue({ accessToken: 'new-access', refreshToken: 'new-refresh' }),
  } as unknown as jest.Mocked<SessionIssuerService>;

  const useCase = new RefreshSessionUseCase(sessions, users, tokens, sessionIssuer);
  return { useCase, sessions, sessionIssuer };
}

describe('RefreshSessionUseCase', () => {
  it('rotates a valid session', async () => {
    const session = buildSession();
    const user = buildUser();
    const { useCase, sessionIssuer } = buildUseCase(session, user);

    const result = await useCase.execute('raw-refresh-token');

    expect(sessionIssuer.rotate).toHaveBeenCalledWith(session, user);
    expect(result.accessToken).toBe('new-access');
    expect(result.refreshToken).toBe('new-refresh');
  });

  it('rejects a revoked session', async () => {
    const session = buildSession({ status: 'REVOKED' });
    const { useCase } = buildUseCase(session, buildUser());

    await expect(useCase.execute('raw-refresh-token')).rejects.toBeInstanceOf(SessionNotFoundError);
  });

  it('rejects an expired session', async () => {
    const session = buildSession({ expiresAt: new Date(Date.now() - 1000) });
    const { useCase } = buildUseCase(session, buildUser());

    await expect(useCase.execute('raw-refresh-token')).rejects.toBeInstanceOf(SessionNotFoundError);
  });

  it('rejects when the session does not exist', async () => {
    const { useCase } = buildUseCase(null, null);

    await expect(useCase.execute('raw-refresh-token')).rejects.toBeInstanceOf(SessionNotFoundError);
  });
});
