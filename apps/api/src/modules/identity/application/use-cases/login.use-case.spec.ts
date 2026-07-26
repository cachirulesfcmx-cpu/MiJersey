import { UserEntity } from '../../domain/entities/user.entity';
import { AccountInactiveError, InvalidCredentialsError } from '../../domain/errors/identity.errors';
import type { AuditLogRepositoryPort } from '../../domain/ports/audit-log.repository.port';
import type { PasswordHasherPort } from '../../domain/ports/password-hasher.port';
import type { UserRepositoryPort } from '../../domain/ports/user.repository.port';
import { RoleName } from '../../domain/value-objects/role-name';
import type { SessionIssuerService } from '../services/session-issuer.service';
import { LoginUseCase } from './login.use-case';

function buildUser(overrides: { isActive?: boolean } = {}): UserEntity {
  return new UserEntity({
    id: 'user-1',
    email: 'customer@example.com',
    passwordHash: 'hashed-password',
    firstName: 'Ada',
    lastName: 'Lovelace',
    role: RoleName.CUSTOMER,
    emailVerifiedAt: null,
    isActive: overrides.isActive ?? true,
    createdAt: new Date(),
  });
}

function buildUseCase(user: UserEntity | null, isValidPassword: boolean) {
  const users: jest.Mocked<UserRepositoryPort> = {
    findByEmail: jest.fn().mockResolvedValue(user),
    findById: jest.fn(),
    create: jest.fn(),
    updatePassword: jest.fn(),
    markEmailVerified: jest.fn(),
    updateProfile: jest.fn(),
    updateRole: jest.fn(),
    setActive: jest.fn(),
    findMany: jest.fn(),
  };
  const hasher: jest.Mocked<PasswordHasherPort> = {
    hash: jest.fn(),
    compare: jest.fn().mockResolvedValue(isValidPassword),
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

  const useCase = new LoginUseCase(users, hasher, auditLog, sessionIssuer);
  return { useCase, users, hasher, auditLog, sessionIssuer };
}

describe('LoginUseCase', () => {
  it('logs in a user with valid credentials', async () => {
    const user = buildUser();
    const { useCase, sessionIssuer, auditLog } = buildUseCase(user, true);

    const result = await useCase.execute({
      email: 'customer@example.com',
      password: 'correct-password',
      userAgent: 'jest',
      ipAddress: '127.0.0.1',
    });

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(sessionIssuer.issue).toHaveBeenCalledWith(user, {
      userAgent: 'jest',
      ipAddress: '127.0.0.1',
    });
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'auth.login.success' }),
    );
  });

  it('rejects an unknown email without revealing that it does not exist', async () => {
    const { useCase, hasher, auditLog } = buildUseCase(null, false);

    await expect(
      useCase.execute({
        email: 'ghost@example.com',
        password: 'x',
        userAgent: null,
        ipAddress: null,
      }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);

    // Se compara siempre contra un hash, exista o no el usuario (mitigación de timing).
    expect(hasher.compare).toHaveBeenCalled();
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'auth.login.failed', userId: null }),
    );
  });

  it('rejects a wrong password', async () => {
    const user = buildUser();
    const { useCase } = buildUseCase(user, false);

    await expect(
      useCase.execute({ email: user.email, password: 'wrong', userAgent: null, ipAddress: null }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('rejects an inactive account', async () => {
    const user = buildUser({ isActive: false });
    const { useCase } = buildUseCase(user, true);

    await expect(
      useCase.execute({
        email: user.email,
        password: 'correct-password',
        userAgent: null,
        ipAddress: null,
      }),
    ).rejects.toBeInstanceOf(AccountInactiveError);
  });
});
