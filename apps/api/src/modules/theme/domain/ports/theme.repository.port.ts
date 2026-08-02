import type { ThemeState } from '../entities/theme-state';
import type { ThemeSnapshot } from '../entities/theme-version.entity';
import type { ThemeSectionKey } from '../value-objects/theme-enums';

export interface UpdateThemeSettingsData {
  siteName?: string;
  logo?: string | null;
  favicon?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  typography?: string;
  borderRadius?: string;
  spacingScale?: string;
}

export interface UpdateThemeSectionData {
  section: ThemeSectionKey;
  config: Record<string, unknown>;
  enabled?: boolean;
}

export interface UpdateThemeStateData {
  settings?: UpdateThemeSettingsData;
  sections?: UpdateThemeSectionData[];
}

export interface ThemeRepositoryPort {
  /** Devuelve el singleton (settings + todas las secciones existentes), creándolo con valores por defecto si es la primera vez que se accede (spec §4 "mantener una configuración activa por sitio"). */
  getState(): Promise<ThemeState>;
  update(data: UpdateThemeStateData): Promise<ThemeState>;
  /** Aplica un snapshot completo (restore) — mismo efecto que `update`, pero reemplaza también las secciones no presentes en el snapshot marcándolas sin config nueva, ya que un snapshot es una foto completa, no un parche. */
  applySnapshot(snapshot: ThemeSnapshot): Promise<ThemeState>;
}
