import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { ThemeSettingsEntity } from '../../domain/entities/theme-settings.entity';
import type { ThemeState } from '../../domain/entities/theme-state';
import { ThemeVersionEntity } from '../../domain/entities/theme-version.entity';
import { ThemeVersionNotFoundError } from '../../domain/errors/theme.errors';
import type { ThemeRepositoryPort } from '../../domain/ports/theme.repository.port';
import type { ThemeVersionRepositoryPort } from '../../domain/ports/theme-version.repository.port';
import { RestoreThemeVersionUseCase } from './restore-theme-version.use-case';

function buildState(siteName: string): ThemeState {
  return {
    settings: new ThemeSettingsEntity({
      id: 'settings-1',
      siteName,
      logo: null,
      favicon: null,
      primaryColor: '#111827',
      secondaryColor: '#6B7280',
      typography: 'Inter, sans-serif',
      borderRadius: '8px',
      spacingScale: '1rem',
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    sections: [],
  };
}

function buildVersion(): ThemeVersionEntity {
  return new ThemeVersionEntity({
    id: 'version-1',
    versionNumber: 1,
    snapshot: {
      siteName: 'MiJersey (viejo)',
      logo: null,
      favicon: null,
      primaryColor: '#000000',
      secondaryColor: '#111111',
      typography: 'Inter, sans-serif',
      borderRadius: '8px',
      spacingScale: '1rem',
      sections: [],
    },
    createdAt: new Date(),
  });
}

function buildUseCase(options: { version?: ThemeVersionEntity | null } = {}) {
  const theme: jest.Mocked<ThemeRepositoryPort> = {
    getState: jest.fn(),
    update: jest.fn(),
    applySnapshot: jest.fn().mockResolvedValue(buildState('MiJersey (viejo)')),
  };
  const versions: jest.Mocked<ThemeVersionRepositoryPort> = {
    findByNumber: jest
      .fn()
      .mockResolvedValue(options.version === undefined ? buildVersion() : options.version),
    findMany: jest.fn(),
    getNextVersionNumber: jest.fn().mockResolvedValue(2),
    create: jest.fn().mockResolvedValue({}),
  };
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  return {
    useCase: new RestoreThemeVersionUseCase(theme, versions, auditLog),
    theme,
    versions,
    auditLog,
  };
}

describe('RestoreThemeVersionUseCase', () => {
  // "Restaurar nunca republica" está garantizado estructuralmente: el caso de uso no
  // depende de ThemeCacheService en absoluto, así que no hay forma de que toque la caché pública.

  it('throws ThemeVersionNotFoundError when the version does not exist', async () => {
    const { useCase } = buildUseCase({ version: null });

    await expect(
      useCase.execute({ versionNumber: 99, actorUserId: 'admin-1', ipAddress: null }),
    ).rejects.toThrow(ThemeVersionNotFoundError);
  });

  it('applies the snapshot to the draft and creates a new version', async () => {
    const { useCase, theme, versions } = buildUseCase();

    const result = await useCase.execute({
      versionNumber: 1,
      actorUserId: 'admin-1',
      ipAddress: null,
    });

    expect(theme.applySnapshot).toHaveBeenCalledWith(
      expect.objectContaining({ siteName: 'MiJersey (viejo)' }),
    );
    expect(versions.create).toHaveBeenCalled();
    expect(result.settings.siteName).toBe('MiJersey (viejo)');
  });

  it('records an audit log entry noting the restored version', async () => {
    const { useCase, auditLog } = buildUseCase();

    await useCase.execute({ versionNumber: 1, actorUserId: 'admin-1', ipAddress: null });

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'theme.version_restored',
        metadata: expect.objectContaining({ restoredFrom: 1 }),
      }),
    );
  });
});
