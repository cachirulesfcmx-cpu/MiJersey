import { UserEntity } from '../../domain/entities/user.entity';
import { InvalidMfaCodeError, MfaChallengeInvalidError } from '../../domain/errors/identity.errors';
import type { AuditLogRepositoryPort } from '../../domain/ports/audit-log.repository.port';
import type { MfaChallengeStorePort } from '../../domain/ports/mfa-challenge-store.port';
import type { MfaSecretCipherPort } from '../../domain/ports/mfa-secret-cipher.port';
import type { TotpServicePort } from '../../domain/ports/totp.service.port';
import type { UserRepositoryPort } from '../../domain/ports/user.repository.port';
import { RoleName } from '../../domain/value-objects/role-name';
import type { SessionIssuerService } from '../services/session-issuer.service';
import { VerifyMfaChallengeUseCase } from './verify-mfa-challenge.use-case';

function buildUser(): UserEntity {
  return new UserEntity({
    id: 'user-1',
    email: 'staff@example.com',
    passwordHash: 'hash',
    firstName: 'Ada',
    lastName: 'Lovelace',
    role: RoleName.ADMIN,
    emailVerifiedAt: new Date(),
    isActive: true,
    mfaSecret: 'encrypted-secret',
    mfaEnabled: true,
    createdAt: new Date(),
  });
}

function buildUseCase(userId: string | null, user: UserEntity | null, isValidCode: boolean) {
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
  const totp: jest.Mocked<TotpServicePort> = {
    generateSecret: jest.fn(),
    buildOtpauthUrl: jest.fn(),
    verifyCode: jest.fn().mockReturnValue(isValidCode),
  };
  const cipher: jest.Mocked<MfaSecretCipherPort> = {
    encrypt: jest.fn(),
    decrypt: jest.fn().mockReturnValue('PLAIN_SECRET'),
  };
  const challenges: jest.Mocked<MfaChallengeStorePort> = {
    create: jest.fn(),
    peek: jest.fn().mockResolvedValue(userId),
    invalidate: jest.fn().mockResolvedValue(undefined),
  };
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };
  const sessionIssuer = {
    issue: jest
      .fn()
      .mockResolvedValue({ accessToken: 'access-token', refreshToken: 'refresh-token' }),
    rotate: jest.fn(),
  } as unknown as jest.Mocked<SessionIssuerService>;

  const useCase = new VerifyMfaChallengeUseCase(
    users,
    totp,
    cipher,
    challenges,
    auditLog,
    sessionIssuer,
  );
  return { useCase, challenges, auditLog, sessionIssuer };
}

describe('VerifyMfaChallengeUseCase', () => {
  it('issues a session when the code is valid', async () => {
    const user = buildUser();
    const { useCase, challenges, sessionIssuer, auditLog } = buildUseCase(user.id, user, true);

    const result = await useCase.execute({
      challengeToken: 'challenge-token',
      code: '123456',
      userAgent: 'jest',
      ipAddress: '127.0.0.1',
    });

    expect(challenges.peek).toHaveBeenCalledWith('challenge-token');
    expect(challenges.invalidate).toHaveBeenCalledWith('challenge-token');
    expect(result.accessToken).toBe('access-token');
    expect(sessionIssuer.issue).toHaveBeenCalledWith(user, {
      userAgent: 'jest',
      ipAddress: '127.0.0.1',
    });
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'auth.login.success', metadata: { mfa: true } }),
    );
  });

  it('rejects an invalid or expired challenge token', async () => {
    const { useCase } = buildUseCase(null, null, true);

    await expect(
      useCase.execute({
        challengeToken: 'bad-token',
        code: '123456',
        userAgent: null,
        ipAddress: null,
      }),
    ).rejects.toBeInstanceOf(MfaChallengeInvalidError);
  });

  it('rejects an incorrect code and audits the failed attempt', async () => {
    const user = buildUser();
    const { useCase, auditLog, sessionIssuer } = buildUseCase(user.id, user, false);

    await expect(
      useCase.execute({
        challengeToken: 'challenge-token',
        code: '000000',
        userAgent: null,
        ipAddress: '127.0.0.1',
      }),
    ).rejects.toBeInstanceOf(InvalidMfaCodeError);

    expect(sessionIssuer.issue).not.toHaveBeenCalled();
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'auth.mfa.challenge_failed' }),
    );
  });

  it('does not invalidate the challenge on an incorrect code, so the user can retry', async () => {
    const user = buildUser();
    const { useCase, challenges } = buildUseCase(user.id, user, false);

    await expect(
      useCase.execute({
        challengeToken: 'challenge-token',
        code: '000000',
        userAgent: null,
        ipAddress: null,
      }),
    ).rejects.toBeInstanceOf(InvalidMfaCodeError);

    expect(challenges.invalidate).not.toHaveBeenCalled();
  });
});
