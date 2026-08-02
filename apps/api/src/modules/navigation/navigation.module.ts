import { Module } from '@nestjs/common';

import { IdentityModule } from '../identity/identity.module';
import { NavigationCacheService } from './application/services/navigation-cache.service';
import { CreateMenuUseCase } from './application/use-cases/create-menu.use-case';
import { DeleteMenuUseCase } from './application/use-cases/delete-menu.use-case';
import { GetMenuUseCase } from './application/use-cases/get-menu.use-case';
import { GetRenderedMenuUseCase } from './application/use-cases/get-rendered-menu.use-case';
import { ListMenuVersionsUseCase } from './application/use-cases/list-menu-versions.use-case';
import { ListMenusUseCase } from './application/use-cases/list-menus.use-case';
import { RestoreMenuVersionUseCase } from './application/use-cases/restore-menu-version.use-case';
import { UpdateMenuUseCase } from './application/use-cases/update-menu.use-case';
import { PrismaNavigationLookupRepository } from './infrastructure/persistence/prisma-navigation-lookup.repository';
import { PrismaNavigationMenuRepository } from './infrastructure/persistence/prisma-navigation-menu.repository';
import { PrismaNavigationVersionRepository } from './infrastructure/persistence/prisma-navigation-version.repository';
import {
  NAVIGATION_LOOKUP,
  NAVIGATION_MENU_REPOSITORY,
  NAVIGATION_VERSION_REPOSITORY,
} from './navigation.constants';
import { AdminNavigationController } from './presentation/controllers/admin-navigation.controller';
import { PublicNavigationController } from './presentation/controllers/public-navigation.controller';

@Module({
  imports: [IdentityModule],
  controllers: [AdminNavigationController, PublicNavigationController],
  providers: [
    NavigationCacheService,
    CreateMenuUseCase,
    UpdateMenuUseCase,
    DeleteMenuUseCase,
    GetMenuUseCase,
    ListMenusUseCase,
    GetRenderedMenuUseCase,
    ListMenuVersionsUseCase,
    RestoreMenuVersionUseCase,
    { provide: NAVIGATION_MENU_REPOSITORY, useClass: PrismaNavigationMenuRepository },
    { provide: NAVIGATION_VERSION_REPOSITORY, useClass: PrismaNavigationVersionRepository },
    { provide: NAVIGATION_LOOKUP, useClass: PrismaNavigationLookupRepository },
  ],
})
export class NavigationModule {}
