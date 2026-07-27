import { Module } from '@nestjs/common';

import { IdentityModule } from '../identity/identity.module';
import { AdjustInventoryUseCase } from './application/use-cases/adjust-inventory.use-case';
import { ConfirmReservationUseCase } from './application/use-cases/confirm-reservation.use-case';
import { CreateWarehouseUseCase } from './application/use-cases/create-warehouse.use-case';
import { GetInventoryItemUseCase } from './application/use-cases/get-inventory-item.use-case';
import { GetWarehouseUseCase } from './application/use-cases/get-warehouse.use-case';
import { ListInventoryUseCase } from './application/use-cases/list-inventory.use-case';
import { ListMovementsUseCase } from './application/use-cases/list-movements.use-case';
import { ListWarehousesUseCase } from './application/use-cases/list-warehouses.use-case';
import { ReleaseStockUseCase } from './application/use-cases/release-stock.use-case';
import { ReserveStockUseCase } from './application/use-cases/reserve-stock.use-case';
import { SetSafetyStockUseCase } from './application/use-cases/set-safety-stock.use-case';
import { UpdateWarehouseUseCase } from './application/use-cases/update-warehouse.use-case';
import { PrismaInventoryItemRepository } from './infrastructure/persistence/prisma-inventory-item.repository';
import { PrismaInventoryMovementRepository } from './infrastructure/persistence/prisma-inventory-movement.repository';
import { PrismaVariantQueryRepository } from './infrastructure/persistence/prisma-variant-query.repository';
import { PrismaWarehouseRepository } from './infrastructure/persistence/prisma-warehouse.repository';
import {
  INVENTORY_ITEM_REPOSITORY,
  INVENTORY_MOVEMENT_REPOSITORY,
  VARIANT_QUERY,
  WAREHOUSE_REPOSITORY,
} from './inventory.constants';
import { AdminInventoryController } from './presentation/controllers/admin-inventory.controller';
import { AdminWarehousesController } from './presentation/controllers/admin-warehouses.controller';

@Module({
  imports: [IdentityModule],
  controllers: [AdminWarehousesController, AdminInventoryController],
  providers: [
    ListWarehousesUseCase,
    GetWarehouseUseCase,
    CreateWarehouseUseCase,
    UpdateWarehouseUseCase,
    ListInventoryUseCase,
    GetInventoryItemUseCase,
    ListMovementsUseCase,
    AdjustInventoryUseCase,
    ReserveStockUseCase,
    ReleaseStockUseCase,
    ConfirmReservationUseCase,
    SetSafetyStockUseCase,
    { provide: WAREHOUSE_REPOSITORY, useClass: PrismaWarehouseRepository },
    { provide: INVENTORY_ITEM_REPOSITORY, useClass: PrismaInventoryItemRepository },
    { provide: INVENTORY_MOVEMENT_REPOSITORY, useClass: PrismaInventoryMovementRepository },
    { provide: VARIANT_QUERY, useClass: PrismaVariantQueryRepository },
  ],
})
export class InventoryModule {}
