import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  ParseEnumPipe,
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
import { CreateRedirectUseCase } from '../../application/use-cases/create-redirect.use-case';
import { DeleteRedirectUseCase } from '../../application/use-cases/delete-redirect.use-case';
import { GetSeoMetadataUseCase } from '../../application/use-cases/get-seo-metadata.use-case';
import { ListRedirectsUseCase } from '../../application/use-cases/list-redirects.use-case';
import { UpsertSeoMetadataUseCase } from '../../application/use-cases/upsert-seo-metadata.use-case';
import { SeoEntityType } from '../../domain/value-objects/seo-enums';
import { CreateRedirectDto } from '../dto/create-redirect.dto';
import { ListRedirectsQueryDto } from '../dto/list-redirects-query.dto';
import { UpsertSeoMetadataDto } from '../dto/upsert-seo-metadata.dto';
import { SeoExceptionFilter } from '../filters/seo-exception.filter';

@Controller('admin/seo')
@UseGuards(PermissionsGuard)
@UseFilters(SeoExceptionFilter)
export class AdminSeoController {
  constructor(
    private readonly getSeoMetadataUseCase: GetSeoMetadataUseCase,
    private readonly upsertSeoMetadataUseCase: UpsertSeoMetadataUseCase,
    private readonly listRedirectsUseCase: ListRedirectsUseCase,
    private readonly createRedirectUseCase: CreateRedirectUseCase,
    private readonly deleteRedirectUseCase: DeleteRedirectUseCase,
  ) {}

  @Get('redirects')
  @RequirePermission('admin:access')
  async listRedirects(@Query() query: ListRedirectsQueryDto) {
    const result = await this.listRedirectsUseCase.execute({
      page: query.page,
      pageSize: query.pageSize,
    });
    return { items: result.items.map((redirect) => redirect.toJSON()), total: result.total };
  }

  @Post('redirects')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('catalog:manage')
  async createRedirect(
    @Body() dto: CreateRedirectDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const redirect = await this.createRedirectUseCase.execute({
      ...dto,
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return redirect.toJSON();
  }

  @Delete('redirects/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('catalog:manage')
  async deleteRedirect(
    @Param('id') id: string,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    await this.deleteRedirectUseCase.execute({ id, actorUserId: user.sub, ipAddress: ip });
  }

  @Get(':entityType/:entityId')
  @RequirePermission('admin:access')
  async getMetadata(
    @Param('entityType', new ParseEnumPipe(SeoEntityType)) entityType: SeoEntityType,
    @Param('entityId') entityId: string,
  ) {
    const metadata = await this.getSeoMetadataUseCase.execute(entityType, entityId);
    return metadata ? metadata.toJSON() : null;
  }

  @Patch(':entityType/:entityId')
  @RequirePermission('catalog:manage')
  async upsertMetadata(
    @Param('entityType', new ParseEnumPipe(SeoEntityType)) entityType: SeoEntityType,
    @Param('entityId') entityId: string,
    @Body() dto: UpsertSeoMetadataDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const metadata = await this.upsertSeoMetadataUseCase.execute({
      entityType,
      entityId,
      ...dto,
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return metadata.toJSON();
  }
}
