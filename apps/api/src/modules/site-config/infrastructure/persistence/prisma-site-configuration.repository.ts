import { Injectable } from '@nestjs/common';
import type { SiteConfiguration as PrismaSiteConfiguration } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { SiteConfigurationEntity } from '../../domain/entities/site-configuration.entity';
import type {
  SiteConfigurationRepositoryPort,
  UpdateSiteConfigurationData,
} from '../../domain/ports/site-configuration.repository.port';
import { DEFAULT_SITE_CONFIGURATION } from '../../site-config.constants';

function toEntity(row: PrismaSiteConfiguration): SiteConfigurationEntity {
  return new SiteConfigurationEntity({
    id: row.id,
    siteName: row.siteName,
    defaultDomain: row.defaultDomain,
    defaultLanguage: row.defaultLanguage,
    defaultCurrency: row.defaultCurrency,
    timezone: row.timezone,
    locale: row.locale,
    supportEmail: row.supportEmail,
    supportPhone: row.supportPhone,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

/** Repositorio del singleton de configuración — crea perezosamente la fila con valores por defecto en el primer acceso (mismo criterio que `PrismaThemeRepository`, 029). */
@Injectable()
export class PrismaSiteConfigurationRepository implements SiteConfigurationRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  private async getOrCreate(): Promise<PrismaSiteConfiguration> {
    const existing = await this.prisma.siteConfiguration.findFirst();
    if (existing) return existing;
    return this.prisma.siteConfiguration.create({ data: { ...DEFAULT_SITE_CONFIGURATION } });
  }

  async getConfiguration(): Promise<SiteConfigurationEntity> {
    return toEntity(await this.getOrCreate());
  }

  async update(data: UpdateSiteConfigurationData): Promise<SiteConfigurationEntity> {
    const existing = await this.getOrCreate();
    const updated = await this.prisma.siteConfiguration.update({
      where: { id: existing.id },
      data,
    });
    return toEntity(updated);
  }
}
