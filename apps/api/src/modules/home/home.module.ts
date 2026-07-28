import { Module } from '@nestjs/common';

import { IdentityModule } from '../identity/identity.module';
import { MediaModule } from '../media/media.module';
import { HomeEnrichmentService } from './application/services/home-enrichment.service';
import { HomeMediaUsageService } from './application/services/home-media-usage.service';
import { CreateHomeSectionUseCase } from './application/use-cases/create-home-section.use-case';
import { DeleteHomeSectionUseCase } from './application/use-cases/delete-home-section.use-case';
import { GetPublicHomeUseCase } from './application/use-cases/get-public-home.use-case';
import { ListAdminHomeSectionsUseCase } from './application/use-cases/list-admin-home-sections.use-case';
import { ReorderHomeSectionsUseCase } from './application/use-cases/reorder-home-sections.use-case';
import { UpdateHomeSectionUseCase } from './application/use-cases/update-home-section.use-case';
import { HOME_LOOKUP, HOME_SECTION_REPOSITORY } from './home.constants';
import { PrismaHomeLookupRepository } from './infrastructure/persistence/prisma-home-lookup.repository';
import { PrismaHomeSectionRepository } from './infrastructure/persistence/prisma-home-section.repository';
import { AdminHomeController } from './presentation/controllers/admin-home.controller';
import { PublicHomeController } from './presentation/controllers/public-home.controller';

@Module({
  imports: [IdentityModule, MediaModule],
  controllers: [AdminHomeController, PublicHomeController],
  providers: [
    ListAdminHomeSectionsUseCase,
    CreateHomeSectionUseCase,
    UpdateHomeSectionUseCase,
    DeleteHomeSectionUseCase,
    ReorderHomeSectionsUseCase,
    GetPublicHomeUseCase,
    HomeEnrichmentService,
    HomeMediaUsageService,
    { provide: HOME_SECTION_REPOSITORY, useClass: PrismaHomeSectionRepository },
    { provide: HOME_LOOKUP, useClass: PrismaHomeLookupRepository },
  ],
})
export class HomeModule {}
