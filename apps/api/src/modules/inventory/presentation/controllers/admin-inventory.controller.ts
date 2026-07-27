import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  Patch,
  Post,
  Query,
  UseFilters,
  UseGuards,
} from '@nestjs/common';

import type { AccessTokenPayload } from '../../../identity/domain/ports/token.service.port';
import { CurrentUser } from '../../../identity/presentation/decorators/current-user.decorator';
import { RequirePermission } from '../../../identity/presentation/decorators/require-permission.decorator';
import { PermissionsGuard } from '../../../identity/presentation/guards/permissions.guard';
import { AdjustInventoryUseCase } from '../../application/use-cases/adjust-inventory.use-case';
import { ConfirmReservationUseCase } from '../../application/use-cases/confirm-reservation.use-case';
import { GetInventoryItemUseCase } from '../../application/use-cases/get-inventory-item.use-case';
import { ListInventoryUseCase } from '../../application/use-cases/list-inventory.use-case';
import { ListMovementsUseCase } from '../../application/use-cases/list-movements.use-case';
import { ReleaseStockUseCase } from '../../application/use-cases/release-stock.use-case';
import { ReserveStockUseCase } from '../../application/use-cases/reserve-stock.use-case';
import { SetSafetyStockUseCase } from '../../application/use-cases/set-safety-stock.use-case';
import { AdjustInventoryDto } from '../dto/adjust-inventory.dto';
import { ListInventoryQueryDto } from '../dto/list-inventory-query.dto';
import { ListMovementsQueryDto } from '../dto/list-movements-query.dto';
import { ReservationReferenceDto } from '../dto/reservation-reference.dto';
import { SetSafetyStockDto } from '../dto/set-safety-stock.dto';
import { InventoryExceptionFilter } from '../filters/inventory-exception.filter';

@Controller('admin/inventory')
@UseGuards(PermissionsGuard)
@UseFilters(InventoryExceptionFilter)
export class AdminInventoryController {
  constructor(
    private readonly listInventoryUseCase: ListInventoryUseCase,
    private readonly getInventoryItemUseCase: GetInventoryItemUseCase,
    private readonly listMovementsUseCase: ListMovementsUseCase,
    private readonly adjustInventoryUseCase: AdjustInventoryUseCase,
    private readonly reserveStockUseCase: ReserveStockUseCase,
    private readonly releaseStockUseCase: ReleaseStockUseCase,
    private readonly confirmReservationUseCase: ConfirmReservationUseCase,
    private readonly setSafetyStockUseCase: SetSafetyStockUseCase,
  ) {}

  @Get()
  @RequirePermission('admin:access')
  async list(@Query() query: ListInventoryQueryDto) {
    const result = await this.listInventoryUseCase.execute({
      page: query.page,
      pageSize: query.pageSize,
      ...(query.search ? { search: query.search } : {}),
      ...(query.warehouseId ? { warehouseId: query.warehouseId } : {}),
      ...(query.belowSafetyStock !== undefined ? { belowSafetyStock: query.belowSafetyStock } : {}),
    });

    return {
      items: result.items.map((view) => ({ ...view.item.toJSON(), variant: view.variant })),
      total: result.total,
    };
  }

  // Declarado antes de ':variantId' para que Express no confunda "movements" con un id (mismo caso que 005/006/007/008).
  @Get('movements')
  @RequirePermission('admin:access')
  async listMovements(@Query() query: ListMovementsQueryDto) {
    const { page, pageSize, ...filter } = query;
    const result = await this.listMovementsUseCase.execute({ page, pageSize, filter });
    return { items: result.items.map((movement) => movement.toJSON()), total: result.total };
  }

  @Get(':variantId')
  @RequirePermission('admin:access')
  async get(@Param('variantId') variantId: string) {
    const items = await this.getInventoryItemUseCase.execute(variantId);
    return items.map((item) => item.toJSON());
  }

  @Post('adjust')
  @RequirePermission('catalog:manage')
  async adjust(
    @Body() dto: AdjustInventoryDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const item = await this.adjustInventoryUseCase.execute({
      ...dto,
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return item.toJSON();
  }

  @Post('reserve')
  @RequirePermission('catalog:manage')
  async reserve(
    @Body() dto: ReservationReferenceDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const item = await this.reserveStockUseCase.execute({
      ...dto,
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return item.toJSON();
  }

  @Post('release')
  @RequirePermission('catalog:manage')
  async release(
    @Body() dto: ReservationReferenceDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const item = await this.releaseStockUseCase.execute({
      ...dto,
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return item.toJSON();
  }

  @Post('confirm')
  @RequirePermission('catalog:manage')
  async confirm(
    @Body() dto: ReservationReferenceDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const item = await this.confirmReservationUseCase.execute({
      ...dto,
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return item.toJSON();
  }

  @Patch('safety-stock')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('catalog:manage')
  async setSafetyStock(
    @Body() dto: SetSafetyStockDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const item = await this.setSafetyStockUseCase.execute({
      ...dto,
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return item.toJSON();
  }
}
