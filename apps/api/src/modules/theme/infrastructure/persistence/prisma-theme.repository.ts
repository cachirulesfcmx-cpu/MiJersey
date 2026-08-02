import { Injectable } from '@nestjs/common';
import type {
  ThemeSection as PrismaThemeSection,
  ThemeSettings as PrismaThemeSettings,
} from '@prisma/client';
import { ThemeSectionKey as PrismaThemeSectionKey } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { ThemeSectionEntity } from '../../domain/entities/theme-section.entity';
import { ThemeSettingsEntity } from '../../domain/entities/theme-settings.entity';
import type { ThemeState } from '../../domain/entities/theme-state';
import type { ThemeSnapshot } from '../../domain/entities/theme-version.entity';
import type {
  ThemeRepositoryPort,
  UpdateThemeStateData,
} from '../../domain/ports/theme.repository.port';
import type { ThemeSectionKey } from '../../domain/value-objects/theme-enums';
import { DEFAULT_THEME_SETTINGS } from '../../theme.constants';

function toSettingsEntity(row: PrismaThemeSettings): ThemeSettingsEntity {
  return new ThemeSettingsEntity({
    id: row.id,
    siteName: row.siteName,
    logo: row.logo,
    favicon: row.favicon,
    primaryColor: row.primaryColor,
    secondaryColor: row.secondaryColor,
    typography: row.typography,
    borderRadius: row.borderRadius,
    spacingScale: row.spacingScale,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

function toSectionEntity(row: PrismaThemeSection): ThemeSectionEntity {
  return new ThemeSectionEntity({
    id: row.id,
    section: row.section as unknown as ThemeSectionKey,
    config: row.config as Record<string, unknown>,
    enabled: row.enabled,
    updatedAt: row.updatedAt,
  });
}

/** Repositorio del singleton de tema — crea perezosamente la fila de `ThemeSettings` con valores por defecto en el primer acceso (mismo criterio que `PrismaCustomerProfileRepository`), ya que nunca debe existir un storefront sin configuración de tema (spec §12). */
@Injectable()
export class PrismaThemeRepository implements ThemeRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  private async getOrCreateSettings(): Promise<PrismaThemeSettings> {
    const existing = await this.prisma.themeSettings.findFirst();
    if (existing) return existing;
    return this.prisma.themeSettings.create({ data: { ...DEFAULT_THEME_SETTINGS } });
  }

  async getState(): Promise<ThemeState> {
    const [settings, sections] = await Promise.all([
      this.getOrCreateSettings(),
      this.prisma.themeSection.findMany(),
    ]);

    return {
      settings: toSettingsEntity(settings),
      sections: sections.map(toSectionEntity),
    };
  }

  async update(data: UpdateThemeStateData): Promise<ThemeState> {
    const settings = await this.getOrCreateSettings();

    const updatedSettings = data.settings
      ? await this.prisma.themeSettings.update({
          where: { id: settings.id },
          data: { ...data.settings },
        })
      : settings;

    for (const section of data.sections ?? []) {
      await this.prisma.themeSection.upsert({
        where: { section: section.section as unknown as PrismaThemeSectionKey },
        create: {
          section: section.section as unknown as PrismaThemeSectionKey,
          config: section.config as object,
          enabled: section.enabled ?? true,
        },
        update: {
          config: section.config as object,
          ...(section.enabled !== undefined ? { enabled: section.enabled } : {}),
        },
      });
    }

    const sections = await this.prisma.themeSection.findMany();
    return { settings: toSettingsEntity(updatedSettings), sections: sections.map(toSectionEntity) };
  }

  async applySnapshot(snapshot: ThemeSnapshot): Promise<ThemeState> {
    const settings = await this.getOrCreateSettings();

    const updatedSettings = await this.prisma.themeSettings.update({
      where: { id: settings.id },
      data: {
        siteName: snapshot.siteName,
        logo: snapshot.logo,
        favicon: snapshot.favicon,
        primaryColor: snapshot.primaryColor,
        secondaryColor: snapshot.secondaryColor,
        typography: snapshot.typography,
        borderRadius: snapshot.borderRadius,
        spacingScale: snapshot.spacingScale,
      },
    });

    for (const section of snapshot.sections) {
      await this.prisma.themeSection.upsert({
        where: { section: section.section as unknown as PrismaThemeSectionKey },
        create: {
          section: section.section as unknown as PrismaThemeSectionKey,
          config: section.config as object,
          enabled: section.enabled,
        },
        update: { config: section.config as object, enabled: section.enabled },
      });
    }

    const sections = await this.prisma.themeSection.findMany();
    return { settings: toSettingsEntity(updatedSettings), sections: sections.map(toSectionEntity) };
  }
}
