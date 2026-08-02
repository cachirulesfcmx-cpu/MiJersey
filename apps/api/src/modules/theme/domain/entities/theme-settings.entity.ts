export interface ThemeSettingsProps {
  id: string;
  siteName: string;
  logo: string | null;
  favicon: string | null;
  primaryColor: string;
  secondaryColor: string;
  typography: string;
  borderRadius: string;
  spacingScale: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ThemeSettingsEntity {
  constructor(private readonly props: ThemeSettingsProps) {}

  get id(): string {
    return this.props.id;
  }

  toJSON(): ThemeSettingsProps {
    return { ...this.props };
  }
}
