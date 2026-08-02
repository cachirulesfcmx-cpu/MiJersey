import type { ThemeSectionKey } from '../value-objects/theme-enums';

export interface ThemeSnapshotSection {
  section: ThemeSectionKey;
  config: Record<string, unknown>;
  enabled: boolean;
}

/** Snapshot completo (mismo criterio que `PageSnapshot`/`PostSnapshot`/`NavigationSnapshot`): settings + todas las secciones, sin id de fila (se reconstruyen tal cual al restaurar). */
export interface ThemeSnapshot {
  siteName: string;
  logo: string | null;
  favicon: string | null;
  primaryColor: string;
  secondaryColor: string;
  typography: string;
  borderRadius: string;
  spacingScale: string;
  sections: ThemeSnapshotSection[];
}

export interface ThemeVersionProps {
  id: string;
  versionNumber: number;
  snapshot: ThemeSnapshot;
  createdAt: Date;
}

export class ThemeVersionEntity {
  constructor(private readonly props: ThemeVersionProps) {}

  get versionNumber(): number {
    return this.props.versionNumber;
  }

  get snapshot(): ThemeSnapshot {
    return this.props.snapshot;
  }

  toJSON(): ThemeVersionProps {
    return { ...this.props };
  }
}
