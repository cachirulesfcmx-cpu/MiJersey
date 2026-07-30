import { Module } from '@nestjs/common';

import { CartModule } from '../cart/cart.module';
import { IdentityModule } from '../identity/identity.module';
import { BuildCheckoutViewUseCase } from './application/use-cases/build-checkout-view.use-case';
import { ConfirmCheckoutUseCase } from './application/use-cases/confirm-checkout.use-case';
import { CreateShippingMethodUseCase } from './application/use-cases/create-shipping-method.use-case';
import { DeleteShippingMethodUseCase } from './application/use-cases/delete-shipping-method.use-case';
import { GetOrCreateCheckoutUseCase } from './application/use-cases/get-or-create-checkout.use-case';
import { ListShippingMethodsUseCase } from './application/use-cases/list-shipping-methods.use-case';
import { ReviewCheckoutUseCase } from './application/use-cases/review-checkout.use-case';
import { SetCheckoutAddressUseCase } from './application/use-cases/set-checkout-address.use-case';
import { SetCheckoutShippingMethodUseCase } from './application/use-cases/set-checkout-shipping-method.use-case';
import { UpdateShippingMethodUseCase } from './application/use-cases/update-shipping-method.use-case';
import {
  CHECKOUT_ADDRESS_REPOSITORY,
  CHECKOUT_INVENTORY_AVAILABILITY,
  CHECKOUT_PRODUCT_LOOKUP,
  CHECKOUT_SESSION_REPOSITORY,
  ORDER_REPOSITORY,
  SHIPPING_METHOD_REPOSITORY,
} from './checkout.constants';
import { PrismaCheckoutAddressRepository } from './infrastructure/persistence/prisma-checkout-address.repository';
import { PrismaCheckoutInventoryAvailabilityRepository } from './infrastructure/persistence/prisma-checkout-inventory-availability.repository';
import { PrismaCheckoutProductLookupRepository } from './infrastructure/persistence/prisma-checkout-product-lookup.repository';
import { PrismaCheckoutSessionRepository } from './infrastructure/persistence/prisma-checkout-session.repository';
import { PrismaOrderRepository } from './infrastructure/persistence/prisma-order.repository';
import { PrismaShippingMethodRepository } from './infrastructure/persistence/prisma-shipping-method.repository';
import { AdminShippingMethodsController } from './presentation/controllers/admin-shipping-methods.controller';
import { PublicCheckoutController } from './presentation/controllers/public-checkout.controller';

@Module({
  imports: [CartModule, IdentityModule],
  controllers: [PublicCheckoutController, AdminShippingMethodsController],
  providers: [
    GetOrCreateCheckoutUseCase,
    SetCheckoutAddressUseCase,
    SetCheckoutShippingMethodUseCase,
    ReviewCheckoutUseCase,
    ConfirmCheckoutUseCase,
    BuildCheckoutViewUseCase,
    ListShippingMethodsUseCase,
    CreateShippingMethodUseCase,
    UpdateShippingMethodUseCase,
    DeleteShippingMethodUseCase,
    { provide: CHECKOUT_SESSION_REPOSITORY, useClass: PrismaCheckoutSessionRepository },
    { provide: CHECKOUT_ADDRESS_REPOSITORY, useClass: PrismaCheckoutAddressRepository },
    { provide: SHIPPING_METHOD_REPOSITORY, useClass: PrismaShippingMethodRepository },
    { provide: ORDER_REPOSITORY, useClass: PrismaOrderRepository },
    { provide: CHECKOUT_PRODUCT_LOOKUP, useClass: PrismaCheckoutProductLookupRepository },
    {
      provide: CHECKOUT_INVENTORY_AVAILABILITY,
      useClass: PrismaCheckoutInventoryAvailabilityRepository,
    },
  ],
})
export class CheckoutModule {}
