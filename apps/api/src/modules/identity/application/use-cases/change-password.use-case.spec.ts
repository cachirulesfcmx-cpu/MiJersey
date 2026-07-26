import { UserEntity } from '../../domain/entities/user.entity';
import { InvalidCredentialsError, UserNotFoundError } from '../../domain/errors/identity.errors';
import type { AuditLogRepositoryPort } from '../../domain/ports/audit-log.repository.port';
import type { PasswordHasherPort } from '../../domain/ports/password-hasher.port';
import type { SessionRepositoryPort } from '../../domain/ports/session.repository.port';
import type { UserRepositoryPort } from '../../domain/ports/user.repository.port';
import { RoleName } from '../../domain/value-objects/role-name';
import { ChangePasswordUseCase } from './change-password.use-case';

function buildUser(): UserEntity {
  return new UserEntity({
    id: 'user-1',
    email: 'staff@example.com',
    passwordHash: 'current-hash',
    firstName: 'Ada',
    lastName: 'Lovelace',
    role: RoleName.ADMIN,
    emailVerifiedAt: new Date(),
    isActive: true,
    createdAt: new Date(),
  });
}

function buildUseCase(user: UserEntity | null, isValidCurrentPassword: boolean) {
  const users: jest.Mocked<UserRepositoryPort> = {
    findById: jest.fn().mockResolvedValue(user),
    findByEmail: jest.fn(),
    create: jest.fn(),
    updatePassword: jest.fn(),
    markEmailVerified: jest.fn(),
    updateProfile: jest.fn(),
    updateRole: jest.fn(),
    setActive: jest.fn(),
    findMany: jest.fn(),
  };
  const hasher: jest.Mocked<PasswordHasherPort> = {
    hash: jest.fn().mockResolvedValue('new-hash'),
    compare: jest.fn().mockResolvedValue(isValidCurrentPassword),
  };
  const sessions: jest.Mocked<SessionRepositoryPort> = {
    create: jest.fn(),
    findByRefreshTokenHash: jest.fn(),
    findById: jest.fn(),
    listActiveByUser: jest.fn(),
    rotate: jest.fn(),
    revoke: jest.fn(),
    revokeAllForUser: jest.fn().mockResolvedValue(undefined),
  };
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  const useCase = new ChangePasswordUseCase(users, hasher, sessions, auditLog);
  return { useCase, users, sessions, auditLog };
}

describe('ChangePasswordUseCase', () => {
  it('changes the password and revokes every other session', async () => {
    const user = buildUser();
    const { useCase, users, sessions, auditLog } = buildUseCase(user, true);

    await useCase.execute({
      userId: user.id,
      currentPassword: 'correct',
      newPassword: 'new-password-123',
      currentSessionId: 'session-current',
      ipAddress: '127.0.0.1',
    });

    expect(users.updatePassword).toHaveBeenCalledWith(user.id, 'new-hash');
    expect(sessions.revokeAllForUser).toHaveBeenCalledWith(user.id, 'session-current');
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'auth.password_changed' }),
    );
  });

  it('rejects an incorrect current password', async () => {
    const user = buildUser();
    const { useCase } = buildUseCase(user, false);

    await expect(
      useCase.execute({
        userId: user.id,
        currentPassword: 'wrong',
        newPassword: 'new-password-123',
        currentSessionId: 'session-current',
        ipAddress: null,
      }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('rejects when the user does not exist', async () => {
    const { useCase } = buildUseCase(null, true);

    await expect(
      useCase.execute({
        userId: 'missing',
        currentPassword: 'whatever',
        newPassword: 'new-password-123',
        currentSessionId: 'session-current',
        ipAddress: null,
      }),
    ).rejects.toBeInstanceOf(UserNotFoundError);
  });
});
