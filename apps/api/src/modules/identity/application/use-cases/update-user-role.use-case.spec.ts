import { UserEntity } from '../../domain/entities/user.entity';
import { CannotModifySelfError, UserNotFoundError } from '../../domain/errors/identity.errors';
import type { AuditLogRepositoryPort } from '../../domain/ports/audit-log.repository.port';
import type { UserRepositoryPort } from '../../domain/ports/user.repository.port';
import { RoleName } from '../../domain/value-objects/role-name';
import { UpdateUserRoleUseCase } from './update-user-role.use-case';

function buildUser(overrides: { id?: string; role?: RoleName } = {}): UserEntity {
  return new UserEntity({
    id: overrides.id ?? 'user-2',
    email: 'staff@example.com',
    passwordHash: 'hash',
    firstName: 'Grace',
    lastName: 'Hopper',
    role: overrides.role ?? RoleName.SUPPORT,
    emailVerifiedAt: new Date(),
    isActive: true,
    mfaSecret: null,
    mfaEnabled: false,
    createdAt: new Date(),
  });
}

function buildUseCase(target: UserEntity | null) {
  const users: jest.Mocked<UserRepositoryPort> = {
    findById: jest.fn().mockResolvedValue(target),
    findByEmail: jest.fn(),
    create: jest.fn(),
    updatePassword: jest.fn(),
    markEmailVerified: jest.fn(),
    updateProfile: jest.fn(),
    updateRole: jest.fn().mockResolvedValue(undefined),
    setActive: jest.fn(),
    updateMfa: jest.fn(),
    findMany: jest.fn(),
  };
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  const useCase = new UpdateUserRoleUseCase(users, auditLog);
  return { useCase, users, auditLog };
}

describe('UpdateUserRoleUseCase', () => {
  it("updates another user's role", async () => {
    const target = buildUser();
    const { useCase, users, auditLog } = buildUseCase(target);

    await useCase.execute({
      targetUserId: target.id,
      role: RoleName.ADMIN,
      requestingUserId: 'requester-1',
      ipAddress: '127.0.0.1',
    });

    expect(users.updateRole).toHaveBeenCalledWith(target.id, RoleName.ADMIN);
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'admin.user.role_changed' }),
    );
  });

  it('rejects modifying your own role', async () => {
    const { useCase } = buildUseCase(buildUser({ id: 'requester-1' }));

    await expect(
      useCase.execute({
        targetUserId: 'requester-1',
        role: RoleName.ADMIN,
        requestingUserId: 'requester-1',
        ipAddress: null,
      }),
    ).rejects.toBeInstanceOf(CannotModifySelfError);
  });

  it('rejects when the target user does not exist', async () => {
    const { useCase } = buildUseCase(null);

    await expect(
      useCase.execute({
        targetUserId: 'missing',
        role: RoleName.ADMIN,
        requestingUserId: 'requester-1',
        ipAddress: null,
      }),
    ).rejects.toBeInstanceOf(UserNotFoundError);
  });
});
