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
  UseFilters,
  UseGuards,
} from '@nestjs/common';

import type { AccessTokenPayload } from '../../../identity/domain/ports/token.service.port';
import { CurrentUser } from '../../../identity/presentation/decorators/current-user.decorator';
import { RequirePermission } from '../../../identity/presentation/decorators/require-permission.decorator';
import { PermissionsGuard } from '../../../identity/presentation/guards/permissions.guard';
import { BulkUpdateVariantsUseCase } from '../../application/use-cases/bulk-update-variants.use-case';
import { DeleteProductVariantUseCase } from '../../application/use-cases/delete-product-variant.use-case';
import { GetProductVariantUseCase } from '../../application/use-cases/get-product-variant.use-case';
import { UpdateProductVariantUseCase } from '../../application/use-cases/update-product-variant.use-case';
import { BulkUpdateVariantsDto } from '../dto/bulk-update-variants.dto';
import { UpdateProductVariantDto } from '../dto/update-product-variant.dto';
import { CatalogExceptionFilter } from '../filters/catalog-exception.filter';

@Controller('admin/variants')
@UseGuards(PermissionsGuard)
@UseFilters(CatalogExceptionFilter)
export class AdminVariantsController {
  constructor(
    private readonly getProductVariantUseCase: GetProductVariantUseCase,
    private readonly updateProductVariantUseCase: UpdateProductVariantUseCase,
    private readonly deleteProductVariantUseCase: DeleteProductVariantUseCase,
    private readonly bulkUpdateVariantsUseCase: BulkUpdateVariantsUseCase,
  ) {}

  // Declarado antes de ':id' para que Express no confunda "bulk" con un id (mismo caso que 005/006).
  @Patch('bulk')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('catalog:manage')
  async bulkUpdate(
    @Body() dto: BulkUpdateVariantsDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    await this.bulkUpdateVariantsUseCase.execute({ ...dto, actorUserId: user.sub, ipAddress: ip });
  }

  @Get(':id')
  @RequirePermission('admin:access')
  async get(@Param('id') id: string) {
    return (await this.getProductVariantUseCase.execute(id)).toJSON();
  }

  @Patch(':id')
  @RequirePermission('catalog:manage')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductVariantDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const variant = await this.updateProductVariantUseCase.execute({
      id,
      ...dto,
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return variant.toJSON();
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('catalog:manage')
  async remove(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload, @Ip() ip: string) {
    await this.deleteProductVariantUseCase.execute({ id, actorUserId: user.sub, ipAddress: ip });
  }
}
