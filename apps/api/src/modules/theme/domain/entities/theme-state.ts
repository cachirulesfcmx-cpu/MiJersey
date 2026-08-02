import type { ThemeSectionEntity, ThemeSectionProps } from './theme-section.entity';
import type { ThemeSettingsEntity, ThemeSettingsProps } from './theme-settings.entity';

/** Vista combinada de la configuración (settings + secciones) — lo que devuelve tanto el borrador admin como la lectura pública, ya que el tema se administra y se consume como una sola unidad (spec §4 "mantener una configuración activa por sitio"). */
export interface ThemeState {
  settings: ThemeSettingsEntity;
  sections: ThemeSectionEntity[];
}

export interface ThemeStateView {
  settings: ThemeSettingsProps;
  sections: ThemeSectionProps[];
}

export function toThemeStateView(state: ThemeState): ThemeStateView {
  return {
    settings: state.settings.toJSON(),
    sections: state.sections.map((section) => section.toJSON()),
  };
}
