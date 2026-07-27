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
import { AssignAttributeToProductUseCase } from '../../application/use-cases/assign-attribute-to-product.use-case';
import { BulkAssignAttributesToProductUseCase } from '../../application/use-cases/bulk-assign-attributes-to-product.use-case';
import { ListProductAttributesUseCase } from '../../application/use-cases/list-product-attributes.use-case';
import { RemoveAttributeFromProductUseCase } from '../../application/use-cases/remove-attribute-from-product.use-case';
import { AssignAttributeDto } from '../dto/assign-attribute.dto';
import { BulkAssignAttributesDto } from '../dto/bulk-assign-attributes.dto';
import { AttributeExceptionFilter } from '../filters/attribute-exception.filter';

@Controller('admin/products/:productId/attributes')
@UseGuards(PermissionsGuard)
@UseFilters(AttributeExceptionFilter)
export class AdminProductAttributesController {
  constructor(
    private readonly listProductAttributesUseCase: ListProductAttributesUseCase,
    private readonly assignAttributeToProductUseCase: AssignAttributeToProductUseCase,
    private readonly bulkAssignAttributesToProductUseCase: BulkAssignAttributesToProductUseCase,
    private readonly removeAttributeFromProductUseCase: RemoveAttributeFromProductUseCase,
  ) {}

  @Get()
  @RequirePermission('admin:access')
  async list(@Param('productId') productId: string) {
    return this.listProductAttributesUseCase.execute(productId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('catalog:manage')
  async assign(
    @Param('productId') productId: string,
    @Body() dto: AssignAttributeDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const assignment = await this.assignAttributeToProductUseCase.execute({
      productId,
      ...dto,
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return assignment.toJSON();
  }

  @Patch('bulk')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('catalog:manage')
  async bulkAssign(
    @Param('productId') productId: string,
    @Body() dto: BulkAssignAttributesDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    await this.bulkAssignAttributesToProductUseCase.execute({
      productId,
      items: dto.items,
      actorUserId: user.sub,
      ipAddress: ip,
    });
  }

  @Delete(':attributeId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('catalog:manage')
  async remove(
    @Param('productId') productId: string,
    @Param('attributeId') attributeId: string,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    await this.removeAttributeFromProductUseCase.execute({
      productId,
      attributeId,
      actorUserId: user.sub,
      ipAddress: ip,
    });
  }
}
