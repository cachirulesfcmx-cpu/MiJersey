import { Controller, Get, Query, UseFilters, UseGuards } from '@nestjs/common';

import { RequirePermission } from '../../../identity/presentation/decorators/require-permission.decorator';
import { PermissionsGuard } from '../../../identity/presentation/guards/permissions.guard';
import { ListAllOrdersUseCase } from '../../application/use-cases/list-all-orders.use-case';
import { ListAllOrdersQueryDto } from '../dto/list-all-orders-query.dto';
import { OrdersExceptionFilter } from '../filters/orders-exception.filter';

/** Orders Dashboard (spec §6) — solo lectura por ahora, sin permiso dedicado (reutiliza `admin:access`, mismo criterio que los métodos de envío de Checkout, 018). No hay endpoints de escritura administrativa todavía: la spec de 021 no pide edición manual de estado y esa capacidad naturalmente pertenece a 022-Payments/023-Shipping cuando confirmen pagos/envíos. */
@Controller('admin/orders')
@UseGuards(PermissionsGuard)
@UseFilters(OrdersExceptionFilter)
export class AdminOrdersController {
  constructor(private readonly listAllOrders: ListAllOrdersUseCase) {}

  @Get()
  @RequirePermission('admin:access')
  async list(@Query() query: ListAllOrdersQueryDto) {
    return this.listAllOrders.execute({
      page: query.page,
      pageSize: query.pageSize,
      ...(query.status !== undefined ? { status: query.status } : {}),
    });
  }
}
