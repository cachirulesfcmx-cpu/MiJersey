import { Module } from '@nestjs/common';

import { IdentityModule } from '../identity/identity.module';
import { MediaModule } from '../media/media.module';
import { AddCartItemUseCase } from './application/use-cases/add-cart-item.use-case';
import { ApplyCouponUseCase } from './application/use-cases/apply-coupon.use-case';
import { BuildCartViewUseCase } from './application/use-cases/build-cart-view.use-case';
import { CreateCouponUseCase } from './application/use-cases/create-coupon.use-case';
import { DeleteCouponUseCase } from './application/use-cases/delete-coupon.use-case';
import { GetOrCreateCartUseCase } from './application/use-cases/get-or-create-cart.use-case';
import { ListCouponsUseCase } from './application/use-cases/list-coupons.use-case';
import { MergeCartUseCase } from './application/use-cases/merge-cart.use-case';
import { RemoveCartItemUseCase } from './application/use-cases/remove-cart-item.use-case';
import { RemoveCouponUseCase } from './application/use-cases/remove-coupon.use-case';
import { UpdateCartItemUseCase } from './application/use-cases/update-cart-item.use-case';
import { UpdateCouponUseCase } from './application/use-cases/update-coupon.use-case';
import {
  CART_INVENTORY_AVAILABILITY,
  CART_ITEM_REPOSITORY,
  CART_PRODUCT_LOOKUP,
  CART_REPOSITORY,
  COUPON_REPOSITORY,
} from './cart.constants';
import { PrismaCartRepository } from './infrastructure/persistence/prisma-cart.repository';
import { PrismaCartInventoryAvailabilityRepository } from './infrastructure/persistence/prisma-cart-inventory-availability.repository';
import { PrismaCartItemRepository } from './infrastructure/persistence/prisma-cart-item.repository';
import { PrismaCartProductLookupRepository } from './infrastructure/persistence/prisma-cart-product-lookup.repository';
import { PrismaCouponRepository } from './infrastructure/persistence/prisma-coupon.repository';
import { AdminCouponsController } from './presentation/controllers/admin-coupons.controller';
import { PublicCartController } from './presentation/controllers/public-cart.controller';
import { OptionalAuthGuard } from './presentation/guards/optional-auth.guard';

@Module({
  imports: [IdentityModule, MediaModule],
  controllers: [PublicCartController, AdminCouponsController],
  providers: [
    OptionalAuthGuard,
    GetOrCreateCartUseCase,
    AddCartItemUseCase,
    UpdateCartItemUseCase,
    RemoveCartItemUseCase,
    ApplyCouponUseCase,
    RemoveCouponUseCase,
    MergeCartUseCase,
    BuildCartViewUseCase,
    ListCouponsUseCase,
    CreateCouponUseCase,
    UpdateCouponUseCase,
    DeleteCouponUseCase,
    { provide: CART_REPOSITORY, useClass: PrismaCartRepository },
    { provide: CART_ITEM_REPOSITORY, useClass: PrismaCartItemRepository },
    { provide: COUPON_REPOSITORY, useClass: PrismaCouponRepository },
    { provide: CART_PRODUCT_LOOKUP, useClass: PrismaCartProductLookupRepository },
    { provide: CART_INVENTORY_AVAILABILITY, useClass: PrismaCartInventoryAvailabilityRepository },
  ],
  exports: [
    GetOrCreateCartUseCase,
    BuildCartViewUseCase,
    OptionalAuthGuard,
    CART_REPOSITORY,
    COUPON_REPOSITORY,
  ],
})
export class CartModule {}
