import {
  Body,
  Controller,
  Delete,
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
import { DeleteProductOptionUseCase } from '../../application/use-cases/delete-product-option.use-case';
import { UpdateProductOptionUseCase } from '../../application/use-cases/update-product-option.use-case';
import { UpdateProductOptionDto } from '../dto/update-product-option.dto';
import { CatalogExceptionFilter } from '../filters/catalog-exception.filter';

@Controller('admin/options')
@UseGuards(PermissionsGuard)
@UseFilters(CatalogExceptionFilter)
export class AdminOptionsController {
  constructor(
    private readonly updateProductOptionUseCase: UpdateProductOptionUseCase,
    private readonly deleteProductOptionUseCase: DeleteProductOptionUseCase,
  ) {}

  @Patch(':id')
  @RequirePermission('catalog:manage')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductOptionDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const option = await this.updateProductOptionUseCase.execute({
      id,
      ...dto,
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return option.toJSON();
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('catalog:manage')
  async remove(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload, @Ip() ip: string) {
    await this.deleteProductOptionUseCase.execute({ id, actorUserId: user.sub, ipAddress: ip });
  }
}
