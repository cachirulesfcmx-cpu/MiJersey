import { Module } from '@nestjs/common';

import { CartModule } from '../cart/cart.module';
import { IdentityModule } from '../identity/identity.module';
import { CancelOrderUseCase } from './application/use-cases/cancel-order.use-case';
import { GetOrderUseCase } from './application/use-cases/get-order.use-case';
import { GetOrderTimelineUseCase } from './application/use-cases/get-order-timeline.use-case';
import { ListAllOrdersUseCase } from './application/use-cases/list-all-orders.use-case';
import { ListOrdersUseCase } from './application/use-cases/list-orders.use-case';
import { ReorderUseCase } from './application/use-cases/reorder.use-case';
import { UpdateOrderStatusUseCase } from './application/use-cases/update-order-status.use-case';
import { PrismaOrderRepository } from './infrastructure/persistence/prisma-order.repository';
import { PrismaOrderStatusHistoryRepository } from './infrastructure/persistence/prisma-order-status-history.repository';
import { ORDER_REPOSITORY, ORDER_STATUS_HISTORY_REPOSITORY } from './orders.constants';
import { AdminOrdersController } from './presentation/controllers/admin-orders.controller';
import { OrdersController } from './presentation/controllers/orders.controller';

@Module({
  imports: [CartModule, IdentityModule],
  controllers: [OrdersController, AdminOrdersController],
  providers: [
    ListOrdersUseCase,
    GetOrderUseCase,
    ListAllOrdersUseCase,
    GetOrderTimelineUseCase,
    CancelOrderUseCase,
    ReorderUseCase,
    UpdateOrderStatusUseCase,
    { provide: ORDER_REPOSITORY, useClass: PrismaOrderRepository },
    { provide: ORDER_STATUS_HISTORY_REPOSITORY, useClass: PrismaOrderStatusHistoryRepository },
  ],
  exports: [GetOrderUseCase, UpdateOrderStatusUseCase, ORDER_REPOSITORY],
})
export class OrdersModule {}
