import type { SiteConfigurationEntity } from '../entities/site-configuration.entity';

export interface UpdateSiteConfigurationData {
  siteName?: string;
  defaultDomain?: string;
  defaultLanguage?: string;
  defaultCurrency?: string;
  timezone?: string;
  locale?: string;
  supportEmail?: string;
  supportPhone?: string | null;
}

export interface SiteConfigurationRepositoryPort {
  /** Devuelve el singleton, creándolo con valores por defecto si es la primera vez que se accede (mismo criterio que `ThemeRepositoryPort.getState`, 029). */
  getConfiguration(): Promise<SiteConfigurationEntity>;
  update(data: UpdateSiteConfigurationData): Promise<SiteConfigurationEntity>;
}
