import { Module } from '@nestjs/common';

import { IdentityModule } from '../identity/identity.module';
import { SeoCacheService } from './application/services/seo-cache.service';
import { SeoRedirectService } from './application/services/seo-redirect.service';
import { CreateRedirectUseCase } from './application/use-cases/create-redirect.use-case';
import { DeleteRedirectUseCase } from './application/use-cases/delete-redirect.use-case';
import { GenerateSitemapUseCase } from './application/use-cases/generate-sitemap.use-case';
import { GetRobotsTxtUseCase } from './application/use-cases/get-robots-txt.use-case';
import { GetSeoMetadataUseCase } from './application/use-cases/get-seo-metadata.use-case';
import { ListRedirectsUseCase } from './application/use-cases/list-redirects.use-case';
import { ResolveRedirectUseCase } from './application/use-cases/resolve-redirect.use-case';
import { UpsertSeoMetadataUseCase } from './application/use-cases/upsert-seo-metadata.use-case';
import { PrismaEntityLookupRepository } from './infrastructure/persistence/prisma-entity-lookup.repository';
import { PrismaRedirectRepository } from './infrastructure/persistence/prisma-redirect.repository';
import { PrismaSeoMetadataRepository } from './infrastructure/persistence/prisma-seo-metadata.repository';
import { PrismaSitemapSourceRepository } from './infrastructure/persistence/prisma-sitemap-source.repository';
import { AdminSeoController } from './presentation/controllers/admin-seo.controller';
import { PublicSeoController } from './presentation/controllers/public-seo.controller';
import {
  ENTITY_LOOKUP,
  REDIRECT_REPOSITORY,
  SEO_METADATA_REPOSITORY,
  SITEMAP_SOURCE,
} from './seo.constants';

@Module({
  imports: [IdentityModule],
  controllers: [AdminSeoController, PublicSeoController],
  providers: [
    GetSeoMetadataUseCase,
    UpsertSeoMetadataUseCase,
    GenerateSitemapUseCase,
    GetRobotsTxtUseCase,
    CreateRedirectUseCase,
    ListRedirectsUseCase,
    DeleteRedirectUseCase,
    ResolveRedirectUseCase,
    SeoCacheService,
    SeoRedirectService,
    { provide: SEO_METADATA_REPOSITORY, useClass: PrismaSeoMetadataRepository },
    { provide: REDIRECT_REPOSITORY, useClass: PrismaRedirectRepository },
    { provide: SITEMAP_SOURCE, useClass: PrismaSitemapSourceRepository },
    { provide: ENTITY_LOOKUP, useClass: PrismaEntityLookupRepository },
  ],
  exports: [SeoRedirectService, GetSeoMetadataUseCase],
})
export class SeoModule {}
