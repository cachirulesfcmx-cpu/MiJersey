import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  ParseIntPipe,
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
import { CreateEmailTemplateUseCase } from '../../application/use-cases/create-email-template.use-case';
import { DeleteEmailTemplateUseCase } from '../../application/use-cases/delete-email-template.use-case';
import { GetEmailTemplateUseCase } from '../../application/use-cases/get-email-template.use-case';
import { ListEmailTemplateVersionsUseCase } from '../../application/use-cases/list-email-template-versions.use-case';
import { ListEmailTemplatesUseCase } from '../../application/use-cases/list-email-templates.use-case';
import { PublishEmailTemplateUseCase } from '../../application/use-cases/publish-email-template.use-case';
import { RestoreEmailTemplateVersionUseCase } from '../../application/use-cases/restore-email-template-version.use-case';
import { TestSendEmailTemplateUseCase } from '../../application/use-cases/test-send-email-template.use-case';
import { UpdateEmailTemplateUseCase } from '../../application/use-cases/update-email-template.use-case';
import { CreateEmailTemplateDto } from '../dto/create-email-template.dto';
import { ListEmailTemplatesQueryDto } from '../dto/list-email-templates-query.dto';
import { ListVersionsQueryDto } from '../dto/list-versions-query.dto';
import { TestSendEmailTemplateDto } from '../dto/test-send-email-template.dto';
import { UpdateEmailTemplateDto } from '../dto/update-email-template.dto';
import { EmailTemplateExceptionFilter } from '../filters/email-template-exception.filter';

/** CRUD + versionado + Test Send de plantillas transaccionales (spec 031 §7) — lecturas bajo `admin:access`, mutaciones bajo `catalog:manage`, mismo criterio que CMS Pages/Blog/Navigation/Theme para contenido administrado por staff (a diferencia de Site Configuration, 030, que exige `system:configure` por ser configuración crítica del sistema). */
@Controller('admin/email/templates')
@UseGuards(PermissionsGuard)
@UseFilters(EmailTemplateExceptionFilter)
export class AdminEmailTemplateController {
  constructor(
    private readonly listTemplates: ListEmailTemplatesUseCase,
    private readonly getTemplate: GetEmailTemplateUseCase,
    private readonly createTemplate: CreateEmailTemplateUseCase,
    private readonly updateTemplate: UpdateEmailTemplateUseCase,
    private readonly deleteTemplate: DeleteEmailTemplateUseCase,
    private readonly publishTemplate: PublishEmailTemplateUseCase,
    private readonly testSendTemplate: TestSendEmailTemplateUseCase,
    private readonly listVersions: ListEmailTemplateVersionsUseCase,
    private readonly restoreVersion: RestoreEmailTemplateVersionUseCase,
  ) {}

  @Get()
  @RequirePermission('admin:access')
  async list(@Query() query: ListEmailTemplatesQueryDto) {
    const result = await this.listTemplates.execute({
      page: query.page,
      pageSize: query.pageSize,
      ...(query.key !== undefined ? { key: query.key } : {}),
      ...(query.language !== undefined ? { language: query.language } : {}),
      ...(query.status !== undefined ? { status: query.status } : {}),
    });
    return { ...result, items: result.items.map((template) => template.toJSON()) };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('catalog:manage')
  async create(
    @Body() dto: CreateEmailTemplateDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const template = await this.createTemplate.execute({
      name: dto.name,
      key: dto.key,
      language: dto.language,
      subject: dto.subject,
      html: dto.html,
      text: dto.text,
      ...(dto.layoutId !== undefined ? { layoutId: dto.layoutId } : {}),
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return template.toJSON();
  }

  @Get(':id')
  @RequirePermission('admin:access')
  async get(@Param('id') id: string) {
    const template = await this.getTemplate.execute(id);
    return template.toJSON();
  }

  @Patch(':id')
  @RequirePermission('catalog:manage')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEmailTemplateDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const template = await this.updateTemplate.execute({
      id,
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.subject !== undefined ? { subject: dto.subject } : {}),
      ...(dto.html !== undefined ? { html: dto.html } : {}),
      ...(dto.text !== undefined ? { text: dto.text } : {}),
      ...(dto.layoutId !== undefined ? { layoutId: dto.layoutId } : {}),
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return template.toJSON();
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('catalog:manage')
  async delete(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload, @Ip() ip: string) {
    await this.deleteTemplate.execute({ id, actorUserId: user.sub, ipAddress: ip });
  }

  @Post(':id/publish')
  @RequirePermission('catalog:manage')
  async publish(
    @Param('id') id: string,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const template = await this.publishTemplate.execute({
      id,
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return template.toJSON();
  }

  @Post(':id/test')
  @RequirePermission('catalog:manage')
  async testSend(
    @Param('id') id: string,
    @Body() dto: TestSendEmailTemplateDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    return this.testSendTemplate.execute({
      templateId: id,
      to: dto.to,
      variables: dto.variables ?? {},
      actorUserId: user.sub,
      ipAddress: ip,
    });
  }

  @Get(':id/versions')
  @RequirePermission('admin:access')
  async versions(@Param('id') id: string, @Query() query: ListVersionsQueryDto) {
    const result = await this.listVersions.execute({
      templateId: id,
      page: query.page,
      pageSize: query.pageSize,
    });
    return { ...result, items: result.items.map((version) => version.toJSON()) };
  }

  @Post(':id/versions/:versionNumber/restore')
  @RequirePermission('catalog:manage')
  async restore(
    @Param('id') id: string,
    @Param('versionNumber', ParseIntPipe) versionNumber: number,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const template = await this.restoreVersion.execute({
      templateId: id,
      versionNumber,
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return template.toJSON();
  }
}
