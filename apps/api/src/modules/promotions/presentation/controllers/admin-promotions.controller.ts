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
  Query,
  UseFilters,
  UseGuards,
} from '@nestjs/common';

import type { AccessTokenPayload } from '../../../identity/domain/ports/token.service.port';
import { CurrentUser } from '../../../identity/presentation/decorators/current-user.decorator';
import { RequirePermission } from '../../../identity/presentation/decorators/require-permission.decorator';
import { PermissionsGuard } from '../../../identity/presentation/guards/permissions.guard';
import { CreatePromotionUseCase } from '../../application/use-cases/create-promotion.use-case';
import { DeletePromotionUseCase } from '../../application/use-cases/delete-promotion.use-case';
import { GetPromotionUseCase } from '../../application/use-cases/get-promotion.use-case';
import { ListPromotionUsageUseCase } from '../../application/use-cases/list-promotion-usage.use-case';
import { ListPromotionsUseCase } from '../../application/use-cases/list-promotions.use-case';
import { UpdatePromotionUseCase } from '../../application/use-cases/update-promotion.use-case';
import { CreatePromotionDto } from '../dto/create-promotion.dto';
import { ListPromotionsQueryDto } from '../dto/list-promotions-query.dto';
import { ListUsageQueryDto } from '../dto/list-usage-query.dto';
import { UpdatePromotionDto } from '../dto/update-promotion.dto';
import { PromotionsExceptionFilter } from '../filters/promotions-exception.filter';

/** Promotion Manager + Usage Dashboard (spec §6) — reutiliza `admin:access`, sin permiso dedicado (mismo criterio que el resto de la sesión). */
@Controller('admin/promotions')
@UseGuards(PermissionsGuard)
@UseFilters(PromotionsExceptionFilter)
export class AdminPromotionsController {
  constructor(
    private readonly listPromotions: ListPromotionsUseCase,
    private readonly getPromotion: GetPromotionUseCase,
    private readonly createPromotion: CreatePromotionUseCase,
    private readonly updatePromotion: UpdatePromotionUseCase,
    private readonly deletePromotion: DeletePromotionUseCase,
    private readonly listPromotionUsage: ListPromotionUsageUseCase,
  ) {}

  @Get()
  @RequirePermission('admin:access')
  async list(@Query() query: ListPromotionsQueryDto) {
    return this.listPromotions.execute({
      page: query.page,
      pageSize: query.pageSize,
      ...(query.status ? { status: query.status } : {}),
    });
  }

  /** Declarado antes de `:id` para que Nest no confunda "usage" con un id de promoción. */
  @Get('usage')
  @RequirePermission('admin:access')
  async usage(@Query() query: ListUsageQueryDto) {
    return this.listPromotionUsage.execute({ page: query.page, pageSize: query.pageSize });
  }

  @Get(':id')
  @RequirePermission('admin:access')
  async get(@Param('id') id: string) {
    const promotion = await this.getPromotion.execute(id);
    return promotion.toJSON();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('admin:access')
  async create(
    @Body() dto: CreatePromotionDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const created = await this.createPromotion.execute({
      name: dto.name,
      type: dto.type,
      discountType: dto.discountType,
      discountValue: dto.discountValue,
      rules: dto.rules ?? [],
      ...(dto.code !== undefined ? { code: dto.code } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
      ...(dto.startsAt !== undefined ? { startsAt: new Date(dto.startsAt) } : {}),
      ...(dto.endsAt !== undefined ? { endsAt: new Date(dto.endsAt) } : {}),
      ...(dto.usageLimit !== undefined ? { usageLimit: dto.usageLimit } : {}),
      ...(dto.stackable !== undefined ? { stackable: dto.stackable } : {}),
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return created.toJSON();
  }

  @Patch(':id')
  @RequirePermission('admin:access')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePromotionDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const updated = await this.updatePromotion.execute({
      id,
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.code !== undefined ? { code: dto.code } : {}),
      ...(dto.discountType !== undefined ? { discountType: dto.discountType } : {}),
      ...(dto.discountValue !== undefined ? { discountValue: dto.discountValue } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
      ...(dto.startsAt !== undefined ? { startsAt: new Date(dto.startsAt) } : {}),
      ...(dto.endsAt !== undefined ? { endsAt: new Date(dto.endsAt) } : {}),
      ...(dto.usageLimit !== undefined ? { usageLimit: dto.usageLimit } : {}),
      ...(dto.stackable !== undefined ? { stackable: dto.stackable } : {}),
      ...(dto.rules !== undefined ? { rules: dto.rules } : {}),
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return updated.toJSON();
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('admin:access')
  async remove(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload, @Ip() ip: string) {
    await this.deletePromotion.execute({ id, actorUserId: user.sub, ipAddress: ip });
  }
}
