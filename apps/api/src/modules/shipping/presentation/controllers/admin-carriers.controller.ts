import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  Patch,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';

import type { AccessTokenPayload } from '../../../identity/domain/ports/token.service.port';
import { CurrentUser } from '../../../identity/presentation/decorators/current-user.decorator';
import { RequirePermission } from '../../../identity/presentation/decorators/require-permission.decorator';
import { PermissionsGuard } from '../../../identity/presentation/guards/permissions.guard';
import { CreateCarrierUseCase } from '../../application/use-cases/create-carrier.use-case';
import { DeleteCarrierUseCase } from '../../application/use-cases/delete-carrier.use-case';
import { ListCarriersUseCase } from '../../application/use-cases/list-carriers.use-case';
import { UpdateCarrierUseCase } from '../../application/use-cases/update-carrier.use-case';
import { CreateCarrierDto } from '../dto/create-carrier.dto';
import { UpdateCarrierDto } from '../dto/update-carrier.dto';
import { ShippingExceptionFilter } from '../filters/shipping-exception.filter';

/** Configuración de transportistas (spec §6 "Shipping Configuration") — reutiliza `admin:access`, sin permiso dedicado (mismo criterio que 018/021/022). */
@Controller('admin/shipping/carriers')
@UseGuards(PermissionsGuard)
@UseFilters(ShippingExceptionFilter)
export class AdminCarriersController {
  constructor(
    private readonly listCarriers: ListCarriersUseCase,
    private readonly createCarrier: CreateCarrierUseCase,
    private readonly updateCarrier: UpdateCarrierUseCase,
    private readonly deleteCarrier: DeleteCarrierUseCase,
  ) {}

  @Get()
  @RequirePermission('admin:access')
  async list() {
    const items = await this.listCarriers.execute();
    return { items: items.map((item) => item.toJSON()) };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('admin:access')
  async create(
    @Body() dto: CreateCarrierDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const created = await this.createCarrier.execute({
      ...dto,
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return created.toJSON();
  }

  @Patch(':id')
  @RequirePermission('admin:access')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCarrierDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const updated = await this.updateCarrier.execute({
      id,
      ...dto,
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return updated.toJSON();
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('admin:access')
  async remove(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload, @Ip() ip: string) {
    await this.deleteCarrier.execute({ id, actorUserId: user.sub, ipAddress: ip });
  }
}
