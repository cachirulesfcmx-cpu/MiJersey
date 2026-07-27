import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  Post,
  Query,
  UseFilters,
  UseGuards,
} from '@nestjs/common';

import type { AccessTokenPayload } from '../../../identity/domain/ports/token.service.port';
import { CurrentUser } from '../../../identity/presentation/decorators/current-user.decorator';
import { RequirePermission } from '../../../identity/presentation/decorators/require-permission.decorator';
import { PermissionsGuard } from '../../../identity/presentation/guards/permissions.guard';
import { CreateProductVariantUseCase } from '../../application/use-cases/create-product-variant.use-case';
import { GenerateVariantsUseCase } from '../../application/use-cases/generate-variants.use-case';
import { ListProductVariantsUseCase } from '../../application/use-cases/list-product-variants.use-case';
import { CreateProductVariantDto } from '../dto/create-product-variant.dto';
import { GenerateVariantsDto } from '../dto/generate-variants.dto';
import { ListVariantsQueryDto } from '../dto/list-variants-query.dto';
import { CatalogExceptionFilter } from '../filters/catalog-exception.filter';

@Controller('admin/products/:productId/variants')
@UseGuards(PermissionsGuard)
@UseFilters(CatalogExceptionFilter)
export class AdminProductVariantsController {
  constructor(
    private readonly listProductVariantsUseCase: ListProductVariantsUseCase,
    private readonly createProductVariantUseCase: CreateProductVariantUseCase,
    private readonly generateVariantsUseCase: GenerateVariantsUseCase,
  ) {}

  @Get()
  @RequirePermission('admin:access')
  async list(@Param('productId') productId: string, @Query() query: ListVariantsQueryDto) {
    const result = await this.listProductVariantsUseCase.execute({
      productId,
      ...(query.status ? { status: [query.status] } : {}),
      page: query.page,
      pageSize: query.pageSize,
    });

    return {
      items: result.items.map((variant) => variant.toJSON()),
      total: result.total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('catalog:manage')
  async create(
    @Param('productId') productId: string,
    @Body() dto: CreateProductVariantDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const variant = await this.createProductVariantUseCase.execute({
      productId,
      ...dto,
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return variant.toJSON();
  }

  @Post('generate')
  @RequirePermission('catalog:manage')
  async generate(
    @Param('productId') productId: string,
    @Body() dto: GenerateVariantsDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    return this.generateVariantsUseCase.execute({
      productId,
      ...dto,
      actorUserId: user.sub,
      ipAddress: ip,
    });
  }
}
