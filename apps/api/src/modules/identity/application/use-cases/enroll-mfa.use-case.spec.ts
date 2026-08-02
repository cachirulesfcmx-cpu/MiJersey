import { UserEntity } from '../../domain/entities/user.entity';
import { MfaNotApplicableError, UserNotFoundError } from '../../domain/errors/identity.errors';
import type { MfaSecretCipherPort } from '../../domain/ports/mfa-secret-cipher.port';
import type { TotpServicePort } from '../../domain/ports/totp.service.port';
import type { UserRepositoryPort } from '../../domain/ports/user.repository.port';
import { RoleName } from '../../domain/value-objects/role-name';
import { EnrollMfaUseCase } from './enroll-mfa.use-case';

jest.mock('../../infrastructure/security/generate-mfa-qr-code', () => ({
  generateMfaQrCode: jest.fn().mockResolvedValue('data:image/png;base64,fake'),
}));

function buildUser(role: RoleName): UserEntity {
  return new UserEntity({
    id: 'user-1',
    email: 'staff@example.com',
    passwordHash: 'hash',
    firstName: 'Ada',
    lastName: 'Lovelace',
    role,
    emailVerifiedAt: new Date(),
    isActive: true,
    mfaSecret: null,
    mfaEnabled: false,
    createdAt: new Date(),
  });
}

function buildUseCase(user: UserEntity | null) {
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
    generateSecret: jest.fn().mockReturnValue('PLAIN_SECRET'),
    buildOtpauthUrl: jest.fn().mockReturnValue('otpauth://totp/MiJersey:staff@example.com'),
    verifyCode: jest.fn(),
  };
  const cipher: jest.Mocked<MfaSecretCipherPort> = {
    encrypt: jest.fn().mockReturnValue('encrypted-secret'),
    decrypt: jest.fn(),
  };

  const useCase = new EnrollMfaUseCase(users, totp, cipher);
  return { useCase, users, totp, cipher };
}

describe('EnrollMfaUseCase', () => {
  it('generates and persists a pending secret for a staff user', async () => {
    const user = buildUser(RoleName.ADMIN);
    const { useCase, users, cipher } = buildUseCase(user);

    const result = await useCase.execute(user.id);

    expect(result.secret).toBe('PLAIN_SECRET');
    expect(result.otpauthUrl).toContain('otpauth://');
    expect(result.qrCodeDataUrl).toContain('data:image/png');
    expect(cipher.encrypt).toHaveBeenCalledWith('PLAIN_SECRET');
    expect(users.updateMfa).toHaveBeenCalledWith(user.id, {
      mfaSecret: 'encrypted-secret',
      mfaEnabled: false,
      mfaEnabledAt: null,
    });
  });

  it('rejects customers — MFA solo aplica a personal interno', async () => {
    const user = buildUser(RoleName.CUSTOMER);
    const { useCase } = buildUseCase(user);

    await expect(useCase.execute(user.id)).rejects.toBeInstanceOf(MfaNotApplicableError);
  });

  it('rejects when the user does not exist', async () => {
    const { useCase } = buildUseCase(null);

    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(UserNotFoundError);
  });
});
