import { Module } from '@nestjs/common';

import { IdentityModule } from '../identity/identity.module';
import { CmsCacheService } from './application/services/cms-cache.service';
import { CreatePageUseCase } from './application/use-cases/create-page.use-case';
import { DeletePageUseCase } from './application/use-cases/delete-page.use-case';
import { GetPageUseCase } from './application/use-cases/get-page.use-case';
import { GetPublishedPageUseCase } from './application/use-cases/get-published-page.use-case';
import { ListPageVersionsUseCase } from './application/use-cases/list-page-versions.use-case';
import { ListPagesUseCase } from './application/use-cases/list-pages.use-case';
import { PublishPageUseCase } from './application/use-cases/publish-page.use-case';
import { RestorePageVersionUseCase } from './application/use-cases/restore-page-version.use-case';
import { UpdatePageUseCase } from './application/use-cases/update-page.use-case';
import { PAGE_REPOSITORY, PAGE_VERSION_REPOSITORY } from './cms.constants';
import { PrismaPageRepository } from './infrastructure/persistence/prisma-page.repository';
import { PrismaPageVersionRepository } from './infrastructure/persistence/prisma-page-version.repository';
import { AdminCmsController } from './presentation/controllers/admin-cms.controller';
import { PublicCmsController } from './presentation/controllers/public-cms.controller';

@Module({
  imports: [IdentityModule],
  controllers: [AdminCmsController, PublicCmsController],
  providers: [
    CmsCacheService,
    CreatePageUseCase,
    UpdatePageUseCase,
    DeletePageUseCase,
    GetPageUseCase,
    ListPagesUseCase,
    PublishPageUseCase,
    GetPublishedPageUseCase,
    ListPageVersionsUseCase,
    RestorePageVersionUseCase,
    { provide: PAGE_REPOSITORY, useClass: PrismaPageRepository },
    { provide: PAGE_VERSION_REPOSITORY, useClass: PrismaPageVersionRepository },
  ],
})
export class CmsModule {}
