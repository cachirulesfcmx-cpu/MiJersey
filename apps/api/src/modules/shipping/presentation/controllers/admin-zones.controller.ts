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
import { CreateZoneUseCase } from '../../application/use-cases/create-zone.use-case';
import { DeleteZoneUseCase } from '../../application/use-cases/delete-zone.use-case';
import { ListZonesUseCase } from '../../application/use-cases/list-zones.use-case';
import { UpdateZoneUseCase } from '../../application/use-cases/update-zone.use-case';
import { CreateZoneDto } from '../dto/create-zone.dto';
import { UpdateZoneDto } from '../dto/update-zone.dto';
import { ShippingExceptionFilter } from '../filters/shipping-exception.filter';

@Controller('admin/shipping/zones')
@UseGuards(PermissionsGuard)
@UseFilters(ShippingExceptionFilter)
export class AdminZonesController {
  constructor(
    private readonly listZones: ListZonesUseCase,
    private readonly createZone: CreateZoneUseCase,
    private readonly updateZone: UpdateZoneUseCase,
    private readonly deleteZone: DeleteZoneUseCase,
  ) {}

  @Get()
  @RequirePermission('admin:access')
  async list() {
    const items = await this.listZones.execute();
    return { items: items.map((item) => item.toJSON()) };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('admin:access')
  async create(
    @Body() dto: CreateZoneDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const created = await this.createZone.execute({ ...dto, actorUserId: user.sub, ipAddress: ip });
    return created.toJSON();
  }

  @Patch(':id')
  @RequirePermission('admin:access')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateZoneDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const updated = await this.updateZone.execute({
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
    await this.deleteZone.execute({ id, actorUserId: user.sub, ipAddress: ip });
  }
}
