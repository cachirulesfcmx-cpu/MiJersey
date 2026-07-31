import { Module } from '@nestjs/common';

import { CartModule } from '../cart/cart.module';
import { CatalogModule } from '../catalog/catalog.module';
import { IdentityModule } from '../identity/identity.module';
import { OrdersModule } from '../orders/orders.module';
import { CartCouponMirrorService } from './application/services/cart-coupon-mirror.service';
import { CreatePromotionUseCase } from './application/use-cases/create-promotion.use-case';
import { DeletePromotionUseCase } from './application/use-cases/delete-promotion.use-case';
import { GetPromotionUseCase } from './application/use-cases/get-promotion.use-case';
import { ListActivePromotionsUseCase } from './application/use-cases/list-active-promotions.use-case';
import { ListPromotionUsageUseCase } from './application/use-cases/list-promotion-usage.use-case';
import { ListPromotionsUseCase } from './application/use-cases/list-promotions.use-case';
import { RecordPromotionUsageUseCase } from './application/use-cases/record-promotion-usage.use-case';
import { UpdatePromotionUseCase } from './application/use-cases/update-promotion.use-case';
import { ValidatePromotionUseCase } from './application/use-cases/validate-promotion.use-case';
import { PrismaPromotionRepository } from './infrastructure/persistence/prisma-promotion.repository';
import { PrismaPromotionUsageRepository } from './infrastructure/persistence/prisma-promotion-usage.repository';
import { AdminPromotionsController } from './presentation/controllers/admin-promotions.controller';
import { PublicPromotionsController } from './presentation/controllers/public-promotions.controller';
import { PROMOTION_REPOSITORY, PROMOTION_USAGE_REPOSITORY } from './promotions.constants';

@Module({
  imports: [IdentityModule, CartModule, CatalogModule, OrdersModule],
  controllers: [PublicPromotionsController, AdminPromotionsController],
  providers: [
    ListPromotionsUseCase,
    GetPromotionUseCase,
    CreatePromotionUseCase,
    UpdatePromotionUseCase,
    DeletePromotionUseCase,
    ListActivePromotionsUseCase,
    ValidatePromotionUseCase,
    RecordPromotionUsageUseCase,
    ListPromotionUsageUseCase,
    CartCouponMirrorService,
    { provide: PROMOTION_REPOSITORY, useClass: PrismaPromotionRepository },
    { provide: PROMOTION_USAGE_REPOSITORY, useClass: PrismaPromotionUsageRepository },
  ],
})
export class PromotionsModule {}
