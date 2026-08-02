export interface SiteConfiguration {
  id: string;
  siteName: string;
  defaultDomain: string;
  defaultLanguage: string;
  defaultCurrency: string;
  timezone: string;
  locale: string;
  supportEmail: string;
  supportPhone: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSiteConfigurationInput {
  siteName?: string;
  defaultDomain?: string;
  defaultLanguage?: string;
  defaultCurrency?: string;
  timezone?: string;
  locale?: string;
  supportEmail?: string;
  supportPhone?: string;
}

export interface SystemSetting {
  id: string;
  key: string;
  value: unknown;
  category: string;
  updatedAt: string;
}

export interface SystemSettingInput {
  key: string;
  value: unknown;
  category: string;
}

export interface UpdateSystemSettingsInput {
  settings: SystemSettingInput[];
}

export interface ListSystemSettingsParams {
  category?: string;
}
