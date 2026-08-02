import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { ThemeSettingsEntity } from '../../domain/entities/theme-settings.entity';
import type { ThemeState } from '../../domain/entities/theme-state';
import { InvalidThemeSectionError } from '../../domain/errors/theme.errors';
import type { ThemeRepositoryPort } from '../../domain/ports/theme.repository.port';
import type { ThemeVersionRepositoryPort } from '../../domain/ports/theme-version.repository.port';
import { ThemeSectionKey } from '../../domain/value-objects/theme-enums';
import { UpdateThemeUseCase } from './update-theme.use-case';

function buildState(): ThemeState {
  return {
    settings: new ThemeSettingsEntity({
      id: 'settings-1',
      siteName: 'MiJersey',
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

function buildUseCase() {
  const theme: jest.Mocked<ThemeRepositoryPort> = {
    getState: jest.fn(),
    update: jest.fn().mockResolvedValue(buildState()),
    applySnapshot: jest.fn(),
  };
  const versions: jest.Mocked<ThemeVersionRepositoryPort> = {
    findByNumber: jest.fn(),
    findMany: jest.fn(),
    getNextVersionNumber: jest.fn().mockResolvedValue(1),
    create: jest.fn().mockResolvedValue({}),
  };
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  return { useCase: new UpdateThemeUseCase(theme, versions, auditLog), theme, versions, auditLog };
}

describe('UpdateThemeUseCase', () => {
  it('rejects an invalid section config before touching the repository', async () => {
    const { useCase, theme } = buildUseCase();

    await expect(
      useCase.execute({
        sections: [{ section: ThemeSectionKey.BANNER, config: {} }],
        actorUserId: 'admin-1',
        ipAddress: null,
      }),
    ).rejects.toThrow(InvalidThemeSectionError);
    expect(theme.update).not.toHaveBeenCalled();
  });

  it('persists valid changes and creates a new version', async () => {
    const { useCase, theme, versions } = buildUseCase();

    await useCase.execute({
      settings: { siteName: 'Nueva tienda' },
      actorUserId: 'admin-1',
      ipAddress: null,
    });

    expect(theme.update).toHaveBeenCalledWith({ settings: { siteName: 'Nueva tienda' } });
    expect(versions.create).toHaveBeenCalled();
  });

  it('records an audit entry listing the touched settings and sections', async () => {
    const { useCase, auditLog } = buildUseCase();

    await useCase.execute({
      settings: { siteName: 'Nueva tienda' },
      sections: [{ section: ThemeSectionKey.HEADER, config: { sticky: true } }],
      actorUserId: 'admin-1',
      ipAddress: null,
    });

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'theme.updated',
        metadata: {
          updatedSettings: ['siteName'],
          updatedSections: [ThemeSectionKey.HEADER],
        },
      }),
    );
  });
});
