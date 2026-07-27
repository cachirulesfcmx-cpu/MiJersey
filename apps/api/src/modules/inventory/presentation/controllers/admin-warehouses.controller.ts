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
import { CreateWarehouseUseCase } from '../../application/use-cases/create-warehouse.use-case';
import { GetWarehouseUseCase } from '../../application/use-cases/get-warehouse.use-case';
import { ListWarehousesUseCase } from '../../application/use-cases/list-warehouses.use-case';
import { UpdateWarehouseUseCase } from '../../application/use-cases/update-warehouse.use-case';
import { CreateWarehouseDto } from '../dto/create-warehouse.dto';
import { ListWarehousesQueryDto } from '../dto/list-warehouses-query.dto';
import { UpdateWarehouseDto } from '../dto/update-warehouse.dto';
import { InventoryExceptionFilter } from '../filters/inventory-exception.filter';

@Controller('admin/warehouses')
@UseGuards(PermissionsGuard)
@UseFilters(InventoryExceptionFilter)
export class AdminWarehousesController {
  constructor(
    private readonly listWarehousesUseCase: ListWarehousesUseCase,
    private readonly getWarehouseUseCase: GetWarehouseUseCase,
    private readonly createWarehouseUseCase: CreateWarehouseUseCase,
    private readonly updateWarehouseUseCase: UpdateWarehouseUseCase,
  ) {}

  @Get()
  @RequirePermission('admin:access')
  async list(@Query() query: ListWarehousesQueryDto) {
    const result = await this.listWarehousesUseCase.execute({
      page: query.page,
      pageSize: query.pageSize,
      filter: {
        ...(query.search ? { search: query.search } : {}),
        ...(query.status ? { status: query.status } : {}),
      },
    });
    return { items: result.items.map((warehouse) => warehouse.toJSON()), total: result.total };
  }

  @Get(':id')
  @RequirePermission('admin:access')
  async get(@Param('id') id: string) {
    return (await this.getWarehouseUseCase.execute(id)).toJSON();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('catalog:manage')
  async create(
    @Body() dto: CreateWarehouseDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const warehouse = await this.createWarehouseUseCase.execute({
      ...dto,
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return warehouse.toJSON();
  }

  @Patch(':id')
  @RequirePermission('catalog:manage')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateWarehouseDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const warehouse = await this.updateWarehouseUseCase.execute({
      id,
      ...dto,
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return warehouse.toJSON();
  }
}
