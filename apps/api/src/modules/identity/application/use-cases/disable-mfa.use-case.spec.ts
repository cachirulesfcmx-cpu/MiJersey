import { UserEntity } from '../../domain/entities/user.entity';
import { InvalidMfaCodeError, MfaNotEnabledError } from '../../domain/errors/identity.errors';
import type { AuditLogRepositoryPort } from '../../domain/ports/audit-log.repository.port';
import type { MfaSecretCipherPort } from '../../domain/ports/mfa-secret-cipher.port';
import type { TotpServicePort } from '../../domain/ports/totp.service.port';
import type { UserRepositoryPort } from '../../domain/ports/user.repository.port';
import { RoleName } from '../../domain/value-objects/role-name';
import { DisableMfaUseCase } from './disable-mfa.use-case';

function buildUser(overrides: { mfaEnabled?: boolean } = {}): UserEntity {
  return new UserEntity({
    id: 'user-1',
    email: 'staff@example.com',
    passwordHash: 'hash',
    firstName: 'Ada',
    lastName: 'Lovelace',
    role: RoleName.ADMIN,
    emailVerifiedAt: new Date(),
    isActive: true,
    mfaSecret: overrides.mfaEnabled === false ? null : 'encrypted-secret',
    mfaEnabled: overrides.mfaEnabled ?? true,
    createdAt: new Date(),
  });
}

function buildUseCase(user: UserEntity | null, isValidCode: boolean) {
  const users: jest.Mocked<UserRepositoryPort> = {
    findById: jest.fn().mockResolvedValue(user),
    findByEmail: jest.fn(),
    create: jest.fn(),
    updatePassword: jest.fn(),
    markEmailVerified: jest.fn(),
    updateProfile: jest.fn(),
    updateRole: jest.fn(),
    setActive: jest.fn(),
    updateMfa: jest.fn().mockResolvedValue(undefined),
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
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  const useCase = new DisableMfaUseCase(users, totp, cipher, auditLog);
  return { useCase, users, auditLog };
}

describe('DisableMfaUseCase', () => {
  it('disables MFA when the current code is valid', async () => {
    const user = buildUser();
    const { useCase, users, auditLog } = buildUseCase(user, true);

    await useCase.execute({ userId: user.id, code: '123456', ipAddress: '127.0.0.1' });

    expect(users.updateMfa).toHaveBeenCalledWith(user.id, {
      mfaSecret: null,
      mfaEnabled: false,
      mfaEnabledAt: null,
    });
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'auth.mfa.disabled' }),
    );
  });

  it('rejects an incorrect code', async () => {
    const user = buildUser();
    const { useCase } = buildUseCase(user, false);

    await expect(
      useCase.execute({ userId: user.id, code: '000000', ipAddress: null }),
    ).rejects.toBeInstanceOf(InvalidMfaCodeError);
  });

  it('rejects when MFA is not enabled', async () => {
    const user = buildUser({ mfaEnabled: false });
    const { useCase } = buildUseCase(user, true);

    await expect(
      useCase.execute({ userId: user.id, code: '123456', ipAddress: null }),
    ).rejects.toBeInstanceOf(MfaNotEnabledError);
  });
});
