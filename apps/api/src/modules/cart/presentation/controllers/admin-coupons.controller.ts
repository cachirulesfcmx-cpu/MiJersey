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
import { CreateCouponUseCase } from '../../application/use-cases/create-coupon.use-case';
import { DeleteCouponUseCase } from '../../application/use-cases/delete-coupon.use-case';
import { ListCouponsUseCase } from '../../application/use-cases/list-coupons.use-case';
import { UpdateCouponUseCase } from '../../application/use-cases/update-coupon.use-case';
import { CreateCouponDto } from '../dto/create-coupon.dto';
import { UpdateCouponDto } from '../dto/update-coupon.dto';
import { CartExceptionFilter } from '../filters/cart-exception.filter';

/** Cupones mínimos propios de Cart (017) — reutiliza `admin:access`/`catalog:manage`, sin permiso dedicado (ver docs/shopping-cart.md). Un motor de promociones completo llega con 024-Coupons-Promotions. */
@Controller('admin/coupons')
@UseGuards(PermissionsGuard)
@UseFilters(CartExceptionFilter)
export class AdminCouponsController {
  constructor(
    private readonly listCoupons: ListCouponsUseCase,
    private readonly createCoupon: CreateCouponUseCase,
    private readonly updateCoupon: UpdateCouponUseCase,
    private readonly deleteCoupon: DeleteCouponUseCase,
  ) {}

  @Get()
  @RequirePermission('admin:access')
  async list() {
    const items = await this.listCoupons.execute();
    return { items: items.map((item) => item.toJSON()) };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('catalog:manage')
  async create(
    @Body() dto: CreateCouponDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const created = await this.createCoupon.execute({
      code: dto.code,
      type: dto.type,
      value: dto.value,
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      ...(dto.expiresAt !== undefined ? { expiresAt: dto.expiresAt } : {}),
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return created.toJSON();
  }

  @Patch(':id')
  @RequirePermission('catalog:manage')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCouponDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const updated = await this.updateCoupon.execute({
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
    await this.deleteCoupon.execute({ id, actorUserId: user.sub, ipAddress: ip });
  }
}
