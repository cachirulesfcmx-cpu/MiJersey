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
import { CreateShippingMethodUseCase } from '../../application/use-cases/create-shipping-method.use-case';
import { DeleteShippingMethodUseCase } from '../../application/use-cases/delete-shipping-method.use-case';
import { ListShippingMethodsUseCase } from '../../application/use-cases/list-shipping-methods.use-case';
import { UpdateShippingMethodUseCase } from '../../application/use-cases/update-shipping-method.use-case';
import { CreateShippingMethodDto } from '../dto/create-shipping-method.dto';
import { UpdateShippingMethodDto } from '../dto/update-shipping-method.dto';
import { CheckoutExceptionFilter } from '../filters/checkout-exception.filter';

/** Métodos de envío mínimos propios de Checkout (018) — reutiliza `admin:access`/`catalog:manage`, sin permiso dedicado (mismo criterio que los cupones de Cart, 017). Ver docs/checkout.md. */
@Controller('admin/shipping-methods')
@UseGuards(PermissionsGuard)
@UseFilters(CheckoutExceptionFilter)
export class AdminShippingMethodsController {
  constructor(
    private readonly listShippingMethods: ListShippingMethodsUseCase,
    private readonly createShippingMethod: CreateShippingMethodUseCase,
    private readonly updateShippingMethod: UpdateShippingMethodUseCase,
    private readonly deleteShippingMethod: DeleteShippingMethodUseCase,
  ) {}

  @Get()
  @RequirePermission('admin:access')
  async list() {
    const items = await this.listShippingMethods.execute();
    return { items: items.map((item) => item.toJSON()) };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('catalog:manage')
  async create(
    @Body() dto: CreateShippingMethodDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const created = await this.createShippingMethod.execute({
      name: dto.name,
      basePrice: dto.basePrice,
      estimatedDaysMin: dto.estimatedDaysMin,
      estimatedDaysMax: dto.estimatedDaysMax,
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return created.toJSON();
  }

  @Patch(':id')
  @RequirePermission('catalog:manage')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateShippingMethodDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const updated = await this.updateShippingMethod.execute({
      id,
      ...dto,
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return updated.toJSON();
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('catalog:manage')
  async remove(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload, @Ip() ip: string) {
    await this.deleteShippingMethod.execute({ id, actorUserId: user.sub, ipAddress: ip });
  }
}
