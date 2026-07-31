import { Module } from '@nestjs/common';

import { CartModule } from '../cart/cart.module';
import { CatalogModule } from '../catalog/catalog.module';
import { IdentityModule } from '../identity/identity.module';
import { OrdersModule } from '../orders/orders.module';
import { CalculateShippingRatesUseCase } from './application/use-cases/calculate-shipping-rates.use-case';
import { CreateCarrierUseCase } from './application/use-cases/create-carrier.use-case';
import { CreateRateUseCase } from './application/use-cases/create-rate.use-case';
import { CreateShipmentUseCase } from './application/use-cases/create-shipment.use-case';
import { CreateZoneUseCase } from './application/use-cases/create-zone.use-case';
import { DeleteCarrierUseCase } from './application/use-cases/delete-carrier.use-case';
import { DeleteRateUseCase } from './application/use-cases/delete-rate.use-case';
import { DeleteZoneUseCase } from './application/use-cases/delete-zone.use-case';
import { GetShipmentByOrderUseCase } from './application/use-cases/get-shipment-by-order.use-case';
import { ListCarriersUseCase } from './application/use-cases/list-carriers.use-case';
import { ListRatesUseCase } from './application/use-cases/list-rates.use-case';
import { ListZonesUseCase } from './application/use-cases/list-zones.use-case';
import { TrackShipmentUseCase } from './application/use-cases/track-shipment.use-case';
import { UpdateCarrierUseCase } from './application/use-cases/update-carrier.use-case';
import { UpdateRateUseCase } from './application/use-cases/update-rate.use-case';
import { UpdateShipmentStatusUseCase } from './application/use-cases/update-shipment-status.use-case';
import { UpdateZoneUseCase } from './application/use-cases/update-zone.use-case';
import { PrismaCarrierRepository } from './infrastructure/persistence/prisma-carrier.repository';
import { PrismaShipmentRepository } from './infrastructure/persistence/prisma-shipment.repository';
import { PrismaShipmentEventRepository } from './infrastructure/persistence/prisma-shipment-event.repository';
import { PrismaShippingRateRepository } from './infrastructure/persistence/prisma-shipping-rate.repository';
import { PrismaShippingZoneRepository } from './infrastructure/persistence/prisma-shipping-zone.repository';
import { ManualCarrierProvider } from './infrastructure/providers/manual-carrier.provider';
import { AdminCarriersController } from './presentation/controllers/admin-carriers.controller';
import { AdminRatesController } from './presentation/controllers/admin-rates.controller';
import { AdminShipmentsController } from './presentation/controllers/admin-shipments.controller';
import { AdminZonesController } from './presentation/controllers/admin-zones.controller';
import { PublicShippingController } from './presentation/controllers/public-shipping.controller';
import { ShippingOrdersController } from './presentation/controllers/shipping-orders.controller';
import {
  CARRIER_PROVIDER,
  CARRIER_REPOSITORY,
  SHIPMENT_EVENT_REPOSITORY,
  SHIPMENT_REPOSITORY,
  SHIPPING_RATE_REPOSITORY,
  SHIPPING_ZONE_REPOSITORY,
} from './shipping.constants';

@Module({
  imports: [IdentityModule, CartModule, CatalogModule, OrdersModule],
  controllers: [
    PublicShippingController,
    ShippingOrdersController,
    AdminCarriersController,
    AdminZonesController,
    AdminRatesController,
    AdminShipmentsController,
  ],
  providers: [
    ListCarriersUseCase,
    CreateCarrierUseCase,
    UpdateCarrierUseCase,
    DeleteCarrierUseCase,
    ListZonesUseCase,
    CreateZoneUseCase,
    UpdateZoneUseCase,
    DeleteZoneUseCase,
    ListRatesUseCase,
    CreateRateUseCase,
    UpdateRateUseCase,
    DeleteRateUseCase,
    CalculateShippingRatesUseCase,
    CreateShipmentUseCase,
    UpdateShipmentStatusUseCase,
    TrackShipmentUseCase,
    GetShipmentByOrderUseCase,
    { provide: CARRIER_REPOSITORY, useClass: PrismaCarrierRepository },
    { provide: SHIPPING_ZONE_REPOSITORY, useClass: PrismaShippingZoneRepository },
    { provide: SHIPPING_RATE_REPOSITORY, useClass: PrismaShippingRateRepository },
    { provide: SHIPMENT_REPOSITORY, useClass: PrismaShipmentRepository },
    { provide: SHIPMENT_EVENT_REPOSITORY, useClass: PrismaShipmentEventRepository },
    { provide: CARRIER_PROVIDER, useClass: ManualCarrierProvider },
  ],
})
export class ShippingModule {}
