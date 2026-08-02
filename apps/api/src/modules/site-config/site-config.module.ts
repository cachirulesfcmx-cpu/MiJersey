import { Module } from '@nestjs/common';

import { IdentityModule } from '../identity/identity.module';
import { SiteConfigCacheService } from './application/services/site-config-cache.service';
import { GetSiteConfigurationUseCase } from './application/use-cases/get-site-configuration.use-case';
import { ListSystemSettingsUseCase } from './application/use-cases/list-system-settings.use-case';
import { UpdateSiteConfigurationUseCase } from './application/use-cases/update-site-configuration.use-case';
import { UpdateSystemSettingsUseCase } from './application/use-cases/update-system-settings.use-case';
import { PrismaSiteConfigurationRepository } from './infrastructure/persistence/prisma-site-configuration.repository';
import { PrismaSystemSettingRepository } from './infrastructure/persistence/prisma-system-setting.repository';
import { SiteConfigController } from './presentation/controllers/site-config.controller';
import { SITE_CONFIGURATION_REPOSITORY, SYSTEM_SETTING_REPOSITORY } from './site-config.constants';

@Module({
  imports: [IdentityModule],
  controllers: [SiteConfigController],
  providers: [
    SiteConfigCacheService,
    GetSiteConfigurationUseCase,
    UpdateSiteConfigurationUseCase,
    ListSystemSettingsUseCase,
    UpdateSystemSettingsUseCase,
    { provide: SITE_CONFIGURATION_REPOSITORY, useClass: PrismaSiteConfigurationRepository },
    { provide: SYSTEM_SETTING_REPOSITORY, useClass: PrismaSystemSettingRepository },
  ],
})
export class SiteConfigModule {}
