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
import { CreateSearchSynonymUseCase } from '../../application/use-cases/create-search-synonym.use-case';
import { DeleteSearchSynonymUseCase } from '../../application/use-cases/delete-search-synonym.use-case';
import { GetSearchAnalyticsUseCase } from '../../application/use-cases/get-search-analytics.use-case';
import { ListSearchSynonymsUseCase } from '../../application/use-cases/list-search-synonyms.use-case';
import { UpdateSearchSynonymUseCase } from '../../application/use-cases/update-search-synonym.use-case';
import { CreateSearchSynonymDto } from '../dto/create-search-synonym.dto';
import { UpdateSearchSynonymDto } from '../dto/update-search-synonym.dto';
import { SearchExceptionFilter } from '../filters/search-exception.filter';

/** Sinónimos y analítica reutilizan `catalog:manage`/`admin:access` — no se creó un permiso `search:manage` dedicado para no sembrar uno nuevo por un puñado de rutas de bajo tráfico. */
@Controller('admin/search')
@UseGuards(PermissionsGuard)
@UseFilters(SearchExceptionFilter)
export class AdminSearchController {
  constructor(
    private readonly listSynonymsUseCase: ListSearchSynonymsUseCase,
    private readonly createSynonymUseCase: CreateSearchSynonymUseCase,
    private readonly updateSynonymUseCase: UpdateSearchSynonymUseCase,
    private readonly deleteSynonymUseCase: DeleteSearchSynonymUseCase,
    private readonly getAnalyticsUseCase: GetSearchAnalyticsUseCase,
  ) {}

  @Get('synonyms')
  @RequirePermission('admin:access')
  async listSynonyms() {
    const items = await this.listSynonymsUseCase.execute();
    return { items: items.map((item) => item.toJSON()) };
  }

  @Post('synonyms')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('catalog:manage')
  async createSynonym(
    @Body() dto: CreateSearchSynonymDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const created = await this.createSynonymUseCase.execute({
      ...dto,
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return created.toJSON();
  }

  @Patch('synonyms/:id')
  @RequirePermission('catalog:manage')
  async updateSynonym(
    @Param('id') id: string,
    @Body() dto: UpdateSearchSynonymDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const updated = await this.updateSynonymUseCase.execute({
      id,
      ...dto,
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return updated.toJSON();
  }

  @Delete('synonyms/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('catalog:manage')
  async deleteSynonym(
    @Param('id') id: string,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    await this.deleteSynonymUseCase.execute({ id, actorUserId: user.sub, ipAddress: ip });
  }

  @Get('analytics')
  @RequirePermission('admin:access')
  getAnalytics() {
    return this.getAnalyticsUseCase.execute();
  }
}
