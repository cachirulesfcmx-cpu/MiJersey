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
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import type { AccessTokenPayload } from '../../../identity/domain/ports/token.service.port';
import { CurrentUser } from '../../../identity/presentation/decorators/current-user.decorator';
import { RequirePermission } from '../../../identity/presentation/decorators/require-permission.decorator';
import { PermissionsGuard } from '../../../identity/presentation/guards/permissions.guard';
import { DeleteMediaUseCase } from '../../application/use-cases/delete-media.use-case';
import { GetMediaUseCase } from '../../application/use-cases/get-media.use-case';
import { ListMediaUseCase } from '../../application/use-cases/list-media.use-case';
import { ListTagsUseCase } from '../../application/use-cases/list-tags.use-case';
import { UpdateMediaUseCase } from '../../application/use-cases/update-media.use-case';
import { UploadMediaUseCase } from '../../application/use-cases/upload-media.use-case';
import { InvalidUploadError } from '../../domain/errors/media.errors';
import { ListMediaQueryDto } from '../dto/list-media-query.dto';
import { UpdateMediaDto } from '../dto/update-media.dto';
import { UploadMediaDto } from '../dto/upload-media.dto';
import { MediaExceptionFilter } from '../filters/media-exception.filter';

const MAX_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024;

function parseTags(tags?: string): string[] | undefined {
  if (!tags) return undefined;
  const parsed = tags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
  return parsed.length ? parsed : undefined;
}

@Controller('admin/media')
@UseGuards(PermissionsGuard)
@UseFilters(MediaExceptionFilter)
export class AdminMediaController {
  constructor(
    private readonly listMediaUseCase: ListMediaUseCase,
    private readonly getMediaUseCase: GetMediaUseCase,
    private readonly uploadMediaUseCase: UploadMediaUseCase,
    private readonly updateMediaUseCase: UpdateMediaUseCase,
    private readonly deleteMediaUseCase: DeleteMediaUseCase,
    private readonly listTagsUseCase: ListTagsUseCase,
  ) {}

  @Get()
  @RequirePermission('admin:access')
  async list(@Query() query: ListMediaQueryDto) {
    const result = await this.listMediaUseCase.execute({
      page: query.page,
      pageSize: query.pageSize,
      filter: {
        ...(query.search ? { search: query.search } : {}),
        ...(query.folderId ? { folderId: query.folderId } : {}),
        ...(query.type ? { type: query.type } : {}),
        ...(query.status ? { status: query.status } : {}),
        ...(query.tagId ? { tagId: query.tagId } : {}),
      },
    });
    return { items: result.items.map((asset) => asset.toJSON()), total: result.total };
  }

  @Get('tags')
  @RequirePermission('admin:access')
  async listTags() {
    const tags = await this.listTagsUseCase.execute();
    return { items: tags.map((tag) => tag.toJSON()) };
  }

  @Get(':id')
  @RequirePermission('admin:access')
  async get(@Param('id') id: string) {
    return (await this.getMediaUseCase.execute(id)).toJSON();
  }

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('catalog:manage')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_SIZE_BYTES } }))
  async upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: UploadMediaDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    if (!file) {
      throw new InvalidUploadError('Debes adjuntar un archivo');
    }

    const tags = parseTags(dto.tags);

    const asset = await this.uploadMediaUseCase.execute({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      folderId: dto.folderId ?? null,
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.altText !== undefined ? { altText: dto.altText } : {}),
      ...(tags !== undefined ? { tags } : {}),
      actorUserId: user.sub,
      ipAddress: ip,
    });

    return asset.toJSON();
  }

  @Patch(':id')
  @RequirePermission('catalog:manage')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateMediaDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const asset = await this.updateMediaUseCase.execute({
      id,
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.altText !== undefined ? { altText: dto.altText } : {}),
      ...(dto.folderId !== undefined ? { folderId: dto.folderId } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.tags !== undefined ? { tags: dto.tags } : {}),
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return asset.toJSON();
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('catalog:manage')
  async delete(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload, @Ip() ip: string) {
    await this.deleteMediaUseCase.execute({ id, actorUserId: user.sub, ipAddress: ip });
  }
}
