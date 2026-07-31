import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseFilters,
} from '@nestjs/common';

import type { AccessTokenPayload } from '../../../identity/domain/ports/token.service.port';
import { CurrentUser } from '../../../identity/presentation/decorators/current-user.decorator';
import { CancelOrderUseCase } from '../../application/use-cases/cancel-order.use-case';
import { GetOrderUseCase } from '../../application/use-cases/get-order.use-case';
import { GetOrderTimelineUseCase } from '../../application/use-cases/get-order-timeline.use-case';
import { ListOrdersUseCase } from '../../application/use-cases/list-orders.use-case';
import { ReorderUseCase } from '../../application/use-cases/reorder.use-case';
import { CancelOrderDto } from '../dto/cancel-order.dto';
import { ListOrdersQueryDto } from '../dto/list-orders-query.dto';
import { OrdersExceptionFilter } from '../filters/orders-exception.filter';

function requireSessionId(sessionId: string | undefined): string {
  if (!sessionId) {
    throw new BadRequestException('Falta el encabezado x-session-id');
  }
  return sessionId;
}

/** Spec §9 "autorización por propietario" — guard global `JwtAuthGuard` (sin `@Public()`), igual que `/me` (019) y `/wishlist` (020). El ciclo de vida completo del pedido (cancelar, línea de tiempo, reordenar) vive aquí; el listado/detalle básico también existe en `/me/orders` (019), que se mantiene sin cambios — ver docs/orders.md. */
@Controller('orders')
@UseFilters(OrdersExceptionFilter)
export class OrdersController {
  constructor(
    private readonly listOrders: ListOrdersUseCase,
    private readonly getOrder: GetOrderUseCase,
    private readonly getOrderTimeline: GetOrderTimelineUseCase,
    private readonly cancelOrder: CancelOrderUseCase,
    private readonly reorder: ReorderUseCase,
  ) {}

  @Get()
  async list(@Query() query: ListOrdersQueryDto, @CurrentUser() user: AccessTokenPayload) {
    return this.listOrders.execute(user.sub, { page: query.page, pageSize: query.pageSize });
  }

  @Get(':id')
  async get(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload) {
    const order = await this.getOrder.execute({ id, customerId: user.sub });
    return order.toJSON();
  }

  @Get(':id/timeline')
  async timeline(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload) {
    const events = await this.getOrderTimeline.execute({ id, customerId: user.sub });
    return { items: events };
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(
    @Param('id') id: string,
    @Body() dto: CancelOrderDto,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    const order = await this.cancelOrder.execute({
      id,
      customerId: user.sub,
      ...(dto.reason !== undefined ? { reason: dto.reason } : {}),
    });
    return order.toJSON();
  }

  @Post(':id/reorder')
  @HttpCode(HttpStatus.OK)
  async reorderOrder(
    @Param('id') id: string,
    @CurrentUser() user: AccessTokenPayload,
    @Headers('x-session-id') sessionIdHeader: string | undefined,
  ) {
    const sessionId = requireSessionId(sessionIdHeader);
    const result = await this.reorder.execute({ id, customerId: user.sub, sessionId });
    return {
      cart: result.cart.toJSON(),
      succeededCount: result.succeededCount,
      failedCount: result.failedCount,
    };
  }
}
