export interface SiteConfigurationProps {
  id: string;
  siteName: string;
  defaultDomain: string;
  defaultLanguage: string;
  defaultCurrency: string;
  timezone: string;
  locale: string;
  supportEmail: string;
  supportPhone: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class SiteConfigurationEntity {
  constructor(private readonly props: SiteConfigurationProps) {}

  get id(): string {
    return this.props.id;
  }

  toJSON(): SiteConfigurationProps {
    return { ...this.props };
  }
}
