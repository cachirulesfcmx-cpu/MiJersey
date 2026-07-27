import { Injectable } from '@nestjs/common';
import type { Folder as PrismaFolder } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { FolderEntity } from '../../domain/entities/folder.entity';
import type {
  CreateFolderData,
  FolderRepositoryPort,
  UpdateFolderData,
} from '../../domain/ports/folder.repository.port';

@Injectable()
export class PrismaFolderRepository implements FolderRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<FolderEntity | null> {
    const folder = await this.prisma.folder.findUnique({ where: { id } });
    return folder ? this.toEntity(folder) : null;
  }

  async findBySlug(slug: string): Promise<FolderEntity | null> {
    const folder = await this.prisma.folder.findUnique({ where: { slug } });
    return folder ? this.toEntity(folder) : null;
  }

  async existsBySlug(slug: string): Promise<boolean> {
    const count = await this.prisma.folder.count({ where: { slug } });
    return count > 0;
  }

  async findAll(): Promise<FolderEntity[]> {
    const folders = await this.prisma.folder.findMany();
    return folders.map((folder) => this.toEntity(folder));
  }

  async create(data: CreateFolderData): Promise<FolderEntity> {
    const folder = await this.prisma.folder.create({ data });
    return this.toEntity(folder);
  }

  async update(id: string, data: UpdateFolderData): Promise<FolderEntity> {
    const folder = await this.prisma.folder.update({ where: { id }, data });
    return this.toEntity(folder);
  }

  async move(id: string, parentId: string | null): Promise<FolderEntity> {
    const folder = await this.prisma.folder.update({ where: { id }, data: { parentId } });
    return this.toEntity(folder);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.folder.delete({ where: { id } });
  }

  async hasChildren(id: string): Promise<boolean> {
    const count = await this.prisma.folder.count({ where: { parentId: id } });
    return count > 0;
  }

  async countAssets(id: string): Promise<number> {
    return this.prisma.mediaAsset.count({ where: { folderId: id } });
  }

  private toEntity(folder: PrismaFolder): FolderEntity {
    return new FolderEntity({
      id: folder.id,
      parentId: folder.parentId,
      name: folder.name,
      slug: folder.slug,
      createdAt: folder.createdAt,
    });
  }
}
