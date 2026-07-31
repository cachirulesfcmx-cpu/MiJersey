import { Module } from '@nestjs/common';

import { CartModule } from '../cart/cart.module';
import { IdentityModule } from '../identity/identity.module';
import { MediaModule } from '../media/media.module';
import { AddWishlistItemUseCase } from './application/use-cases/add-wishlist-item.use-case';
import { BuildWishlistViewUseCase } from './application/use-cases/build-wishlist-view.use-case';
import { GetOrCreateWishlistUseCase } from './application/use-cases/get-or-create-wishlist.use-case';
import { GetSharedWishlistUseCase } from './application/use-cases/get-shared-wishlist.use-case';
import { MoveWishlistItemToCartUseCase } from './application/use-cases/move-wishlist-item-to-cart.use-case';
import { RemoveWishlistItemUseCase } from './application/use-cases/remove-wishlist-item.use-case';
import { ShareWishlistUseCase } from './application/use-cases/share-wishlist.use-case';
import { PrismaWishlistRepository } from './infrastructure/persistence/prisma-wishlist.repository';
import { PrismaWishlistInventoryAvailabilityRepository } from './infrastructure/persistence/prisma-wishlist-inventory-availability.repository';
import { PrismaWishlistItemRepository } from './infrastructure/persistence/prisma-wishlist-item.repository';
import { PrismaWishlistProductLookupRepository } from './infrastructure/persistence/prisma-wishlist-product-lookup.repository';
import { SharedWishlistController } from './presentation/controllers/shared-wishlist.controller';
import { WishlistController } from './presentation/controllers/wishlist.controller';
import {
  WISHLIST_INVENTORY_AVAILABILITY,
  WISHLIST_ITEM_REPOSITORY,
  WISHLIST_PRODUCT_LOOKUP,
  WISHLIST_REPOSITORY,
} from './wishlist.constants';

@Module({
  imports: [CartModule, IdentityModule, MediaModule],
  controllers: [WishlistController, SharedWishlistController],
  providers: [
    GetOrCreateWishlistUseCase,
    AddWishlistItemUseCase,
    RemoveWishlistItemUseCase,
    MoveWishlistItemToCartUseCase,
    ShareWishlistUseCase,
    GetSharedWishlistUseCase,
    BuildWishlistViewUseCase,
    { provide: WISHLIST_REPOSITORY, useClass: PrismaWishlistRepository },
    { provide: WISHLIST_ITEM_REPOSITORY, useClass: PrismaWishlistItemRepository },
    { provide: WISHLIST_PRODUCT_LOOKUP, useClass: PrismaWishlistProductLookupRepository },
    {
      provide: WISHLIST_INVENTORY_AVAILABILITY,
      useClass: PrismaWishlistInventoryAvailabilityRepository,
    },
  ],
})
export class WishlistModule {}
