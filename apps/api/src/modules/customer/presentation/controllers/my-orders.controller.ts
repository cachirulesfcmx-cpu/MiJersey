import { Controller, Get, Param, Query, UseFilters } from '@nestjs/common';

import type { AccessTokenPayload } from '../../../identity/domain/ports/token.service.port';
import { CurrentUser } from '../../../identity/presentation/decorators/current-user.decorator';
import { GetMyOrderUseCase } from '../../application/use-cases/get-my-order.use-case';
import { ListMyOrdersUseCase } from '../../application/use-cases/list-my-orders.use-case';
import { ListMyOrdersQueryDto } from '../dto/list-my-orders-query.dto';
import { CustomerExceptionFilter } from '../filters/customer-exception.filter';

/** Lectura de solo consulta sobre `Order`/`OrderItem` (018) — el ciclo de vida completo (cancelar, reembolsar, timeline) es responsabilidad de 021-Orders. */
@Controller('me/orders')
@UseFilters(CustomerExceptionFilter)
export class MyOrdersController {
  constructor(
    private readonly listMyOrders: ListMyOrdersUseCase,
    private readonly getMyOrder: GetMyOrderUseCase,
  ) {}

  @Get()
  async list(@Query() query: ListMyOrdersQueryDto, @CurrentUser() user: AccessTokenPayload) {
    return this.listMyOrders.execute(user.sub, { page: query.page, pageSize: query.pageSize });
  }

  @Get(':id')
  async get(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload) {
    return this.getMyOrder.execute({ id, customerId: user.sub });
  }
}
