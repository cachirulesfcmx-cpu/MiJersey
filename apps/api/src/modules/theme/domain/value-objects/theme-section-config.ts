import { ThemeSectionKey } from './theme-enums';

export interface HeaderSectionConfig {
  showSearch?: boolean;
  showAccountLink?: boolean;
  sticky?: boolean;
}

export interface FooterLinkGroup {
  title: string;
  links: Array<{ label: string; url: string }>;
}

export interface FooterSectionConfig {
  columns?: FooterLinkGroup[];
  showNewsletter?: boolean;
  copyrightText?: string;
}

export interface BannerSectionConfig {
  message: string;
  url?: string;
  backgroundColor?: string;
  dismissible?: boolean;
}

export interface LayoutSectionConfig {
  containerWidth?: string;
  headerStyle?: 'standard' | 'centered' | 'minimal';
}

export type ThemeSectionConfiguration = Record<string, unknown>;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/** Validación mínima de forma por sección — no un esquema completo, solo lo suficiente para detectar configuraciones incompletas antes de guardarlas, mismo criterio que `validateHomeSectionConfig` (013) y `validatePageBlockConfig` (026). */
export function validateThemeSectionConfig(
  section: ThemeSectionKey,
  config: ThemeSectionConfiguration,
): string | null {
  switch (section) {
    case ThemeSectionKey.HEADER:
      return null;
    case ThemeSectionKey.FOOTER: {
      const c = config as Partial<FooterSectionConfig>;
      if (c.columns !== undefined) {
        if (!Array.isArray(c.columns)) return 'columns debe ser un arreglo';
        const invalid = c.columns.some(
          (column) => !isNonEmptyString(column?.title) || !Array.isArray(column?.links),
        );
        if (invalid) return 'cada columna requiere title y links';
      }
      return null;
    }
    case ThemeSectionKey.BANNER: {
      const c = config as Partial<BannerSectionConfig>;
      if (!isNonEmptyString(c.message)) return 'message es obligatorio';
      return null;
    }
    case ThemeSectionKey.LAYOUT:
      return null;
    default:
      return null;
  }
}
