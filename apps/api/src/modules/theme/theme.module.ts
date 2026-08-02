import { Module } from '@nestjs/common';

import { IdentityModule } from '../identity/identity.module';
import { ThemeCacheService } from './application/services/theme-cache.service';
import { GetAdminThemeUseCase } from './application/use-cases/get-admin-theme.use-case';
import { GetPublishedThemeUseCase } from './application/use-cases/get-published-theme.use-case';
import { ListThemeVersionsUseCase } from './application/use-cases/list-theme-versions.use-case';
import { PublishThemeUseCase } from './application/use-cases/publish-theme.use-case';
import { RestoreThemeVersionUseCase } from './application/use-cases/restore-theme-version.use-case';
import { UpdateThemeUseCase } from './application/use-cases/update-theme.use-case';
import { PrismaThemeRepository } from './infrastructure/persistence/prisma-theme.repository';
import { PrismaThemeVersionRepository } from './infrastructure/persistence/prisma-theme-version.repository';
import { AdminThemeController } from './presentation/controllers/admin-theme.controller';
import { PublicThemeController } from './presentation/controllers/public-theme.controller';
import { THEME_REPOSITORY, THEME_VERSION_REPOSITORY } from './theme.constants';

@Module({
  imports: [IdentityModule],
  controllers: [AdminThemeController, PublicThemeController],
  providers: [
    ThemeCacheService,
    GetAdminThemeUseCase,
    GetPublishedThemeUseCase,
    UpdateThemeUseCase,
    PublishThemeUseCase,
    ListThemeVersionsUseCase,
    RestoreThemeVersionUseCase,
    { provide: THEME_REPOSITORY, useClass: PrismaThemeRepository },
    { provide: THEME_VERSION_REPOSITORY, useClass: PrismaThemeVersionRepository },
  ],
})
export class ThemeModule {}
