import {
  Body,
  Controller,
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
import { CreateShipmentUseCase } from '../../application/use-cases/create-shipment.use-case';
import { UpdateShipmentStatusUseCase } from '../../application/use-cases/update-shipment-status.use-case';
import { CreateShipmentDto } from '../dto/create-shipment.dto';
import { UpdateShipmentStatusDto } from '../dto/update-shipment-status.dto';
import { ShippingExceptionFilter } from '../filters/shipping-exception.filter';

/** `POST /shipping/shipments` (spec §7) vive en administración: generar un envío es una acción operativa, no algo que el cliente dispare — mismo criterio que `POST /admin/payments/refund` (022). */
@Controller('admin/shipments')
@UseGuards(PermissionsGuard)
@UseFilters(ShippingExceptionFilter)
export class AdminShipmentsController {
  constructor(
    private readonly createShipment: CreateShipmentUseCase,
    private readonly updateShipmentStatus: UpdateShipmentStatusUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('admin:access')
  async create(
    @Body() dto: CreateShipmentDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const created = await this.createShipment.execute({
      ...dto,
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return created.toJSON();
  }

  @Patch(':id/status')
  @RequirePermission('admin:access')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateShipmentStatusDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const updated = await this.updateShipmentStatus.execute({
      id,
      status: dto.status,
      ...(dto.note !== undefined ? { note: dto.note } : {}),
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return updated.toJSON();
  }
}
