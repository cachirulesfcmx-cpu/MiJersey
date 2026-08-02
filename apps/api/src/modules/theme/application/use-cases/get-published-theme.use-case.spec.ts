import { ThemeSettingsEntity } from '../../domain/entities/theme-settings.entity';
import type { ThemeState } from '../../domain/entities/theme-state';
import type { ThemeRepositoryPort } from '../../domain/ports/theme.repository.port';
import type { ThemeCacheService } from '../services/theme-cache.service';
import { GetPublishedThemeUseCase } from './get-published-theme.use-case';

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
  const cache = {
    getPublished: jest.fn().mockResolvedValue(null),
    setPublished: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<ThemeCacheService>;

  return { useCase: new GetPublishedThemeUseCase(theme, cache), theme, cache };
}

describe('GetPublishedThemeUseCase', () => {
  it('returns the cached value without hitting the repository when present', async () => {
    const { useCase, theme, cache } = buildUseCase();
    (cache.getPublished as jest.Mock).mockResolvedValue(
      JSON.stringify({ settings: { siteName: 'Cached' }, sections: [] }),
    );

    const result = await useCase.execute();

    expect(theme.getState).not.toHaveBeenCalled();
    expect(result.settings.siteName).toBe('Cached');
  });

  it('falls back to the current draft and seeds the cache when nothing has been published yet', async () => {
    const { useCase, theme, cache } = buildUseCase();

    const result = await useCase.execute();

    expect(theme.getState).toHaveBeenCalled();
    expect(result.settings.siteName).toBe('MiJersey');
    expect(cache.setPublished).toHaveBeenCalledWith(
      expect.stringContaining('"siteName":"MiJersey"'),
    );
  });
});
