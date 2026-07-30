import { Module } from '@nestjs/common';

import { IdentityModule } from '../identity/identity.module';
import { CreateAddressUseCase } from './application/use-cases/create-address.use-case';
import { DeleteAddressUseCase } from './application/use-cases/delete-address.use-case';
import { GetMyAccountUseCase } from './application/use-cases/get-my-account.use-case';
import { GetMyOrderUseCase } from './application/use-cases/get-my-order.use-case';
import { ListAddressesUseCase } from './application/use-cases/list-addresses.use-case';
import { ListMyOrdersUseCase } from './application/use-cases/list-my-orders.use-case';
import { UpdateAddressUseCase } from './application/use-cases/update-address.use-case';
import { UpdateMyAccountUseCase } from './application/use-cases/update-my-account.use-case';
import {
  ADDRESS_REPOSITORY,
  CUSTOMER_ORDER_LOOKUP,
  CUSTOMER_PROFILE_REPOSITORY,
} from './customer.constants';
import { PrismaAddressRepository } from './infrastructure/persistence/prisma-address.repository';
import { PrismaCustomerOrderLookupRepository } from './infrastructure/persistence/prisma-customer-order-lookup.repository';
import { PrismaCustomerProfileRepository } from './infrastructure/persistence/prisma-customer-profile.repository';
import { MyAccountController } from './presentation/controllers/my-account.controller';
import { MyAddressesController } from './presentation/controllers/my-addresses.controller';
import { MyOrdersController } from './presentation/controllers/my-orders.controller';

@Module({
  imports: [IdentityModule],
  controllers: [MyAccountController, MyAddressesController, MyOrdersController],
  providers: [
    GetMyAccountUseCase,
    UpdateMyAccountUseCase,
    ListAddressesUseCase,
    CreateAddressUseCase,
    UpdateAddressUseCase,
    DeleteAddressUseCase,
    ListMyOrdersUseCase,
    GetMyOrderUseCase,
    { provide: CUSTOMER_PROFILE_REPOSITORY, useClass: PrismaCustomerProfileRepository },
    { provide: ADDRESS_REPOSITORY, useClass: PrismaAddressRepository },
    { provide: CUSTOMER_ORDER_LOOKUP, useClass: PrismaCustomerOrderLookupRepository },
  ],
})
export class CustomerModule {}
