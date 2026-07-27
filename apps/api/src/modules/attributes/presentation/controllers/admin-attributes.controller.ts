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
import { CreateAttributeUseCase } from '../../application/use-cases/create-attribute.use-case';
import { DeleteAttributeUseCase } from '../../application/use-cases/delete-attribute.use-case';
import { GetAttributeUseCase } from '../../application/use-cases/get-attribute.use-case';
import { ListAttributesUseCase } from '../../application/use-cases/list-attributes.use-case';
import { UpdateAttributeUseCase } from '../../application/use-cases/update-attribute.use-case';
import { CreateAttributeDto } from '../dto/create-attribute.dto';
import { ListAttributesQueryDto } from '../dto/list-attributes-query.dto';
import { UpdateAttributeDto } from '../dto/update-attribute.dto';
import { AttributeExceptionFilter } from '../filters/attribute-exception.filter';

@Controller('admin/attributes')
@UseGuards(PermissionsGuard)
@UseFilters(AttributeExceptionFilter)
export class AdminAttributesController {
  constructor(
    private readonly listAttributesUseCase: ListAttributesUseCase,
    private readonly getAttributeUseCase: GetAttributeUseCase,
    private readonly createAttributeUseCase: CreateAttributeUseCase,
    private readonly updateAttributeUseCase: UpdateAttributeUseCase,
    private readonly deleteAttributeUseCase: DeleteAttributeUseCase,
  ) {}

  @Get()
  @RequirePermission('admin:access')
  async list(@Query() query: ListAttributesQueryDto) {
    const result = await this.listAttributesUseCase.execute({
      page: query.page,
      pageSize: query.pageSize,
      filter: {
        ...(query.search ? { search: query.search } : {}),
        ...(query.status ? { status: [query.status] } : {}),
        ...(query.type ? { type: [query.type] } : {}),
        ...(query.isFilterable !== undefined ? { isFilterable: query.isFilterable } : {}),
      },
    });
    return { items: result.items.map((attribute) => attribute.toJSON()), total: result.total };
  }

  @Get(':id')
  @RequirePermission('admin:access')
  async get(@Param('id') id: string) {
    return (await this.getAttributeUseCase.execute(id)).toJSON();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('catalog:manage')
  async create(
    @Body() dto: CreateAttributeDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const attribute = await this.createAttributeUseCase.execute({
      ...dto,
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return attribute.toJSON();
  }

  @Patch(':id')
  @RequirePermission('catalog:manage')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAttributeDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const attribute = await this.updateAttributeUseCase.execute({
      id,
      ...dto,
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return attribute.toJSON();
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('catalog:manage')
  async remove(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload, @Ip() ip: string) {
    await this.deleteAttributeUseCase.execute({ id, actorUserId: user.sub, ipAddress: ip });
  }
}
