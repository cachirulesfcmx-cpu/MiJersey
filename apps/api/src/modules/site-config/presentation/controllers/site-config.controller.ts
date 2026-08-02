import { Body, Controller, Get, Ip, Patch, Query, UseFilters, UseGuards } from '@nestjs/common';

import type { AccessTokenPayload } from '../../../identity/domain/ports/token.service.port';
import { CurrentUser } from '../../../identity/presentation/decorators/current-user.decorator';
import { RequirePermission } from '../../../identity/presentation/decorators/require-permission.decorator';
import { PermissionsGuard } from '../../../identity/presentation/guards/permissions.guard';
import { GetSiteConfigurationUseCase } from '../../application/use-cases/get-site-configuration.use-case';
import { ListSystemSettingsUseCase } from '../../application/use-cases/list-system-settings.use-case';
import { UpdateSiteConfigurationUseCase } from '../../application/use-cases/update-site-configuration.use-case';
import { UpdateSystemSettingsUseCase } from '../../application/use-cases/update-system-settings.use-case';
import { ListSystemSettingsQueryDto } from '../dto/list-system-settings-query.dto';
import { UpdateSiteConfigurationDto } from '../dto/update-site-configuration.dto';
import { UpdateSystemSettingsDto } from '../dto/update-system-settings.dto';
import { SiteConfigExceptionFilter } from '../filters/site-config-exception.filter';

/** Configuración global del sitio (spec 030 §7) — a diferencia de los módulos de contenido (CMS Pages/Blog/Navigation/Theme), aquí las mutaciones exigen `system:configure` en vez de `catalog:manage`: es el permiso que el seed (003) ya reserva para "configurar ajustes globales de la plataforma", exclusivo de `SUPER_ADMIN`, mismo criterio de "configuraciones críticas" (spec §9). */
@Controller('admin/settings')
@UseGuards(PermissionsGuard)
@UseFilters(SiteConfigExceptionFilter)
export class SiteConfigController {
  constructor(
    private readonly getSiteConfiguration: GetSiteConfigurationUseCase,
    private readonly updateSiteConfiguration: UpdateSiteConfigurationUseCase,
    private readonly listSystemSettings: ListSystemSettingsUseCase,
    private readonly updateSystemSettings: UpdateSystemSettingsUseCase,
  ) {}

  @Get('site')
  @RequirePermission('admin:access')
  async getSite() {
    return this.getSiteConfiguration.execute();
  }

  @Patch('site')
  @RequirePermission('system:configure')
  async updateSite(
    @Body() dto: UpdateSiteConfigurationDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    return this.updateSiteConfiguration.execute({
      ...(dto.siteName !== undefined ? { siteName: dto.siteName } : {}),
      ...(dto.defaultDomain !== undefined ? { defaultDomain: dto.defaultDomain } : {}),
      ...(dto.defaultLanguage !== undefined ? { defaultLanguage: dto.defaultLanguage } : {}),
      ...(dto.defaultCurrency !== undefined ? { defaultCurrency: dto.defaultCurrency } : {}),
      ...(dto.timezone !== undefined ? { timezone: dto.timezone } : {}),
      ...(dto.locale !== undefined ? { locale: dto.locale } : {}),
      ...(dto.supportEmail !== undefined ? { supportEmail: dto.supportEmail } : {}),
      ...(dto.supportPhone !== undefined ? { supportPhone: dto.supportPhone } : {}),
      actorUserId: user.sub,
      ipAddress: ip,
    });
  }

  @Get('system')
  @RequirePermission('admin:access')
  async getSystem(@Query() query: ListSystemSettingsQueryDto) {
    const settings = await this.listSystemSettings.execute(query.category);
    return settings.map((setting) => setting.toJSON());
  }

  @Patch('system')
  @RequirePermission('system:configure')
  async updateSystem(
    @Body() dto: UpdateSystemSettingsDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const settings = await this.updateSystemSettings.execute({
      settings: dto.settings,
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return settings.map((setting) => setting.toJSON());
  }
}
