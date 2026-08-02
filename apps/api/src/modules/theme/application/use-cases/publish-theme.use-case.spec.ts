import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { ThemeSettingsEntity } from '../../domain/entities/theme-settings.entity';
import type { ThemeState } from '../../domain/entities/theme-state';
import type { ThemeRepositoryPort } from '../../domain/ports/theme.repository.port';
import type { ThemeVersionRepositoryPort } from '../../domain/ports/theme-version.repository.port';
import type { ThemeCacheService } from '../services/theme-cache.service';
import { PublishThemeUseCase } from './publish-theme.use-case';

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
    getState: jest.fn().mockResolvedValue(buildState()),
    update: jest.fn(),
    applySnapshot: jest.fn(),
  };
  const versions: jest.Mocked<ThemeVersionRepositoryPort> = {
    findByNumber: jest.fn(),
    findMany: jest.fn(),
    getNextVersionNumber: jest.fn().mockResolvedValue(1),
    create: jest.fn().mockResolvedValue({}),
  };
  const cache = {
    getPublished: jest.fn(),
    setPublished: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<ThemeCacheService>;
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  return {
    useCase: new PublishThemeUseCase(theme, versions, cache, auditLog),
    theme,
    versions,
    cache,
    auditLog,
  };
}

describe('PublishThemeUseCase', () => {
  it('writes the current draft to the public cache', async () => {
    const { useCase, cache } = buildUseCase();

    await useCase.execute({ actorUserId: 'admin-1', ipAddress: null });

    expect(cache.setPublished).toHaveBeenCalledWith(
      expect.stringContaining('"siteName":"MiJersey"'),
    );
  });

  it('creates a version snapshot for the publication', async () => {
    const { useCase, versions } = buildUseCase();

    await useCase.execute({ actorUserId: 'admin-1', ipAddress: null });

    expect(versions.create).toHaveBeenCalledWith(
      expect.objectContaining({ siteName: 'MiJersey', sections: [] }),
    );
  });

  it('records an audit log entry', async () => {
    const { useCase, auditLog } = buildUseCase();

    await useCase.execute({ actorUserId: 'admin-1', ipAddress: '127.0.0.1' });

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'admin-1', action: 'theme.published' }),
    );
  });
});
