import type { ThemeState } from '../entities/theme-state';
import type { ThemeSnapshot } from '../entities/theme-version.entity';

/** Convierte el estado actual (settings + secciones) en el JSON completo que respalda un `ThemeVersion`. */
export function toThemeSnapshot(state: ThemeState): ThemeSnapshot {
  const settings = state.settings.toJSON();
  return {
    siteName: settings.siteName,
    logo: settings.logo,
    favicon: settings.favicon,
    primaryColor: settings.primaryColor,
    secondaryColor: settings.secondaryColor,
    typography: settings.typography,
    borderRadius: settings.borderRadius,
    spacingScale: settings.spacingScale,
    sections: state.sections.map((section) => {
      const json = section.toJSON();
      return { section: json.section, config: json.config, enabled: json.enabled };
    }),
  };
}
