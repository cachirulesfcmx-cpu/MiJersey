import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';

import type { AccessTokenPayload } from '../../../identity/domain/ports/token.service.port';
import { CurrentUser } from '../../../identity/presentation/decorators/current-user.decorator';
import { RequirePermission } from '../../../identity/presentation/decorators/require-permission.decorator';
import { PermissionsGuard } from '../../../identity/presentation/guards/permissions.guard';
import { CreateProductOptionUseCase } from '../../application/use-cases/create-product-option.use-case';
import { GetProductOptionsUseCase } from '../../application/use-cases/get-product-options.use-case';
import { CreateProductOptionDto } from '../dto/create-product-option.dto';
import { CatalogExceptionFilter } from '../filters/catalog-exception.filter';

@Controller('admin/products/:productId/options')
@UseGuards(PermissionsGuard)
@UseFilters(CatalogExceptionFilter)
export class AdminProductOptionsController {
  constructor(
    private readonly getProductOptionsUseCase: GetProductOptionsUseCase,
    private readonly createProductOptionUseCase: CreateProductOptionUseCase,
  ) {}

  @Get()
  @RequirePermission('admin:access')
  async list(@Param('productId') productId: string) {
    const options = await this.getProductOptionsUseCase.execute(productId);
    return options.map((option) => option.toJSON());
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('catalog:manage')
  async create(
    @Param('productId') productId: string,
    @Body() dto: CreateProductOptionDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const option = await this.createProductOptionUseCase.execute({
      productId,
      ...dto,
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return option.toJSON();
  }
}
