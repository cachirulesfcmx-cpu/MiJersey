import { Module } from '@nestjs/common';

import { IdentityModule } from '../identity/identity.module';
import { CreateReviewUseCase } from './application/use-cases/create-review.use-case';
import { ListPendingReviewsUseCase } from './application/use-cases/list-pending-reviews.use-case';
import { ListProductReviewsUseCase } from './application/use-cases/list-product-reviews.use-case';
import { ModerateReviewUseCase } from './application/use-cases/moderate-review.use-case';
import { PrismaReviewRepository } from './infrastructure/persistence/prisma-review.repository';
import { PrismaReviewProductLookupRepository } from './infrastructure/persistence/prisma-review-product-lookup.repository';
import { AdminReviewsController } from './presentation/controllers/admin-reviews.controller';
import { PublicReviewsController } from './presentation/controllers/public-reviews.controller';
import { REVIEW_PRODUCT_LOOKUP, REVIEW_REPOSITORY } from './reviews.constants';

@Module({
  // IdentityModule: resuelve TOKEN_SERVICE (OptionalAuthGuard) y las dependencias de PermissionsGuard
  // para el controller admin — mismo patrón que PromotionsModule.
  imports: [IdentityModule],
  controllers: [PublicReviewsController, AdminReviewsController],
  providers: [
    CreateReviewUseCase,
    ListProductReviewsUseCase,
    ListPendingReviewsUseCase,
    ModerateReviewUseCase,
    { provide: REVIEW_REPOSITORY, useClass: PrismaReviewRepository },
    { provide: REVIEW_PRODUCT_LOOKUP, useClass: PrismaReviewProductLookupRepository },
  ],
})
export class ReviewsModule {}
