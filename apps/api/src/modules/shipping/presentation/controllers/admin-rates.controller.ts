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
import { CreateRateUseCase } from '../../application/use-cases/create-rate.use-case';
import { DeleteRateUseCase } from '../../application/use-cases/delete-rate.use-case';
import { ListRatesUseCase } from '../../application/use-cases/list-rates.use-case';
import { UpdateRateUseCase } from '../../application/use-cases/update-rate.use-case';
import { CreateRateDto } from '../dto/create-rate.dto';
import { UpdateRateDto } from '../dto/update-rate.dto';
import { ShippingExceptionFilter } from '../filters/shipping-exception.filter';

@Controller('admin/shipping/rates')
@UseGuards(PermissionsGuard)
@UseFilters(ShippingExceptionFilter)
export class AdminRatesController {
  constructor(
    private readonly listRates: ListRatesUseCase,
    private readonly createRate: CreateRateUseCase,
    private readonly updateRate: UpdateRateUseCase,
    private readonly deleteRate: DeleteRateUseCase,
  ) {}

  @Get()
  @RequirePermission('admin:access')
  async list() {
    const items = await this.listRates.execute();
    return { items: items.map((item) => item.toJSON()) };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('admin:access')
  async create(
    @Body() dto: CreateRateDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const created = await this.createRate.execute({ ...dto, actorUserId: user.sub, ipAddress: ip });
    return created.toJSON();
  }

  @Patch(':id')
  @RequirePermission('admin:access')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRateDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const updated = await this.updateRate.execute({
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
    await this.deleteRate.execute({ id, actorUserId: user.sub, ipAddress: ip });
  }
}
