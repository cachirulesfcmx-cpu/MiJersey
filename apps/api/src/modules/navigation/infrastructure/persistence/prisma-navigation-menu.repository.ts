import type { PaginatedResult } from '@mijersey/shared-types';
import { Injectable } from '@nestjs/common';
import type {
  NavigationItem as PrismaNavigationItem,
  NavigationMenu as PrismaNavigationMenu,
  Prisma,
} from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { NavigationItemEntity } from '../../domain/entities/navigation-item.entity';
import { NavigationMenuEntity } from '../../domain/entities/navigation-menu.entity';
import type {
  CreateMenuData,
  ListMenusParams,
  NavigationItemInput,
  NavigationMenuRepositoryPort,
  UpdateMenuData,
} from '../../domain/ports/navigation-menu.repository.port';
import {
  NavigationItemType,
  NavigationMenuStatus,
} from '../../domain/value-objects/navigation-enums';
import { toParentFirstOrder } from '../../domain/value-objects/navigation-tree.util';
import type { VisibilityRules } from '../../domain/value-objects/visibility-rules.util';

type MenuWithItems = PrismaNavigationMenu & { items: PrismaNavigationItem[] };

function toItemEntity(row: PrismaNavigationItem): NavigationItemEntity {
  return new NavigationItemEntity({
    id: row.id,
    menuId: row.menuId,
    parentId: row.parentId,
    label: row.label,
    type: row.type as NavigationItemType,
    target: row.target,
    icon: row.icon,
    sortOrder: row.sortOrder,
    visibilityRules: row.visibilityRules as VisibilityRules | null,
    openInNewTab: row.openInNewTab,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

function toMenuEntity(row: MenuWithItems): NavigationMenuEntity {
  return new NavigationMenuEntity({
    id: row.id,
    name: row.name,
    location: row.location,
    status: row.status as NavigationMenuStatus,
    items: row.items.map(toItemEntity),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

@Injectable()
export class PrismaNavigationMenuRepository implements NavigationMenuRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<NavigationMenuEntity | null> {
    const row = await this.prisma.navigationMenu.findUnique({
      where: { id },
      include: { items: true },
    });
    return row ? toMenuEntity(row) : null;
  }

  async findMany(params: ListMenusParams): Promise<PaginatedResult<NavigationMenuEntity>> {
    const skip = (params.page - 1) * params.pageSize;
    const where: Prisma.NavigationMenuWhereInput = {
      ...(params.location ? { location: params.location } : {}),
      ...(params.status ? { status: params.status } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.navigationMenu.findMany({
        where,
        include: { items: true },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: params.pageSize,
      }),
      this.prisma.navigationMenu.count({ where }),
    ]);

    return {
      items: rows.map(toMenuEntity),
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
    };
  }

  async findPublishedByLocation(location: string): Promise<NavigationMenuEntity | null> {
    const row = await this.prisma.navigationMenu.findFirst({
      where: { location, status: 'PUBLISHED' },
      include: { items: true },
      orderBy: { updatedAt: 'desc' },
    });
    return row ? toMenuEntity(row) : null;
  }

  async create(data: CreateMenuData): Promise<NavigationMenuEntity> {
    const menu = await this.prisma.navigationMenu.create({
      data: { name: data.name, location: data.location },
    });
    await this.createItems(menu.id, data.items);
    return this.findById(menu.id) as Promise<NavigationMenuEntity>;
  }

  async update(id: string, data: UpdateMenuData): Promise<NavigationMenuEntity> {
    const { items, ...rest } = data;
    await this.prisma.navigationMenu.update({ where: { id }, data: rest });

    if (items !== undefined) {
      await this.prisma.navigationItem.deleteMany({ where: { menuId: id } });
      await this.createItems(id, items);
    }

    return this.findById(id) as Promise<NavigationMenuEntity>;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.navigationMenu.delete({ where: { id } });
  }

  private async createItems(menuId: string, items: NavigationItemInput[]): Promise<void> {
    if (items.length === 0) return;

    const ordered = toParentFirstOrder(
      items.map((item) => ({ ...item, id: item.tempId, parentId: item.parentTempId })),
    );
    const idByTempId = new Map<string, string>();

    for (const item of ordered) {
      const parentId = item.parentTempId ? (idByTempId.get(item.parentTempId) ?? null) : null;
      const row = await this.prisma.navigationItem.create({
        data: {
          menuId,
          parentId,
          label: item.label,
          type: item.type,
          target: item.target,
          icon: item.icon ?? null,
          sortOrder: item.sortOrder,
          ...(item.visibilityRules
            ? { visibilityRules: item.visibilityRules as Prisma.InputJsonValue }
            : {}),
          openInNewTab: item.openInNewTab ?? false,
        },
      });
      idByTempId.set(item.tempId, row.id);
    }
  }
}
