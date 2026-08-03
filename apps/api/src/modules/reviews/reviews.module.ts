import { Module } from '@nestjs/common';

import { IdentityModule } from '../identity/identity.module';
import { MediaModule } from '../media/media.module';
import { CreateReviewUseCase } from './application/use-cases/create-review.use-case';
import { ListFeaturedReviewsUseCase } from './application/use-cases/list-featured-reviews.use-case';
import { ListPendingReviewsUseCase } from './application/use-cases/list-pending-reviews.use-case';
import { ListProductReviewsUseCase } from './application/use-cases/list-product-reviews.use-case';
import { ModerateReviewUseCase } from './application/use-cases/moderate-review.use-case';
import { PrismaReviewRepository } from './infrastructure/persistence/prisma-review.repository';
import { PrismaReviewProductLookupRepository } from './infrastructure/persistence/prisma-review-product-lookup.repository';
import { AdminReviewsController } from './presentation/controllers/admin-reviews.controller';
import { FeaturedReviewsController } from './presentation/controllers/featured-reviews.controller';
import { PublicReviewsController } from './presentation/controllers/public-reviews.controller';
import { REVIEW_PRODUCT_LOOKUP, REVIEW_REPOSITORY } from './reviews.constants';

@Module({
  // IdentityModule: resuelve TOKEN_SERVICE (OptionalAuthGuard) y las dependencias de PermissionsGuard
  // para el controller admin — mismo patrón que PromotionsModule. MediaModule: resuelve MediaUsageService
  // para ListFeaturedReviewsUseCase (imagen del producto en la reseña destacada del home).
  imports: [IdentityModule, MediaModule],
  controllers: [PublicReviewsController, FeaturedReviewsController, AdminReviewsController],
  providers: [
    CreateReviewUseCase,
    ListProductReviewsUseCase,
    ListFeaturedReviewsUseCase,
    ListPendingReviewsUseCase,
    ModerateReviewUseCase,
    { provide: REVIEW_REPOSITORY, useClass: PrismaReviewRepository },
    { provide: REVIEW_PRODUCT_LOOKUP, useClass: PrismaReviewProductLookupRepository },
  ],
})
export class ReviewsModule {}
