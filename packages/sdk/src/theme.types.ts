export type ThemeSectionKey = 'HEADER' | 'FOOTER' | 'BANNER' | 'LAYOUT';

export interface ThemeSettings {
  id: string;
  siteName: string;
  logo: string | null;
  favicon: string | null;
  primaryColor: string;
  secondaryColor: string;
  typography: string;
  borderRadius: string;
  spacingScale: string;
  createdAt: string;
  updatedAt: string;
}

export interface ThemeSection {
  id: string;
  section: ThemeSectionKey;
  config: Record<string, unknown>;
  enabled: boolean;
  updatedAt: string;
}

export interface ThemeState {
  settings: ThemeSettings;
  sections: ThemeSection[];
}

export interface ThemeVersionSnapshotSection {
  section: ThemeSectionKey;
  config: Record<string, unknown>;
  enabled: boolean;
}

export interface ThemeVersionSnapshot {
  siteName: string;
  logo: string | null;
  favicon: string | null;
  primaryColor: string;
  secondaryColor: string;
  typography: string;
  borderRadius: string;
  spacingScale: string;
  sections: ThemeVersionSnapshotSection[];
}

export interface ThemeVersion {
  id: string;
  versionNumber: number;
  snapshot: ThemeVersionSnapshot;
  createdAt: string;
}

export interface UpdateThemeSettingsInput {
  siteName?: string;
  logo?: string | null;
  favicon?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  typography?: string;
  borderRadius?: string;
  spacingScale?: string;
}

export interface UpdateThemeSectionInput {
  section: ThemeSectionKey;
  config: Record<string, unknown>;
  enabled?: boolean;
}

export interface UpdateThemeInput {
  settings?: UpdateThemeSettingsInput;
  sections?: UpdateThemeSectionInput[];
}
