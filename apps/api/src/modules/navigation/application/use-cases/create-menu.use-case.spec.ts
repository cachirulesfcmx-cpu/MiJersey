import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { NavigationItemEntity } from '../../domain/entities/navigation-item.entity';
import { NavigationMenuEntity } from '../../domain/entities/navigation-menu.entity';
import {
  NavigationDepthExceededError,
  NavigationTargetNotFoundError,
} from '../../domain/errors/navigation.errors';
import type { NavigationLookupPort } from '../../domain/ports/navigation-lookup.port';
import type {
  CreateMenuData,
  NavigationItemInput,
  NavigationMenuRepositoryPort,
} from '../../domain/ports/navigation-menu.repository.port';
import type { NavigationVersionRepositoryPort } from '../../domain/ports/navigation-version.repository.port';
import {
  NavigationItemType,
  NavigationMenuStatus,
} from '../../domain/value-objects/navigation-enums';
import { CreateMenuUseCase } from './create-menu.use-case';

function buildCreatedMenu(data: CreateMenuData): NavigationMenuEntity {
  return new NavigationMenuEntity({
    id: 'menu-1',
    name: data.name,
    location: data.location,
    status: NavigationMenuStatus.DRAFT,
    items: data.items.map(
      (item) =>
        new NavigationItemEntity({
          id: item.tempId,
          menuId: 'menu-1',
          parentId: item.parentTempId,
          label: item.label,
          type: item.type,
          target: item.target,
          icon: item.icon ?? null,
          sortOrder: item.sortOrder,
          visibilityRules: item.visibilityRules ?? null,
          openInNewTab: item.openInNewTab ?? false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
    ),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildUseCase(existingTargets: string[] = []) {
  const menus: jest.Mocked<NavigationMenuRepositoryPort> = {
    findById: jest.fn(),
    findMany: jest.fn(),
    findPublishedByLocation: jest.fn(),
    create: jest.fn().mockImplementation((data) => Promise.resolve(buildCreatedMenu(data))),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const versions: jest.Mocked<NavigationVersionRepositoryPort> = {
    findByMenuAndNumber: jest.fn(),
    findMany: jest.fn(),
    getNextVersionNumber: jest.fn().mockResolvedValue(1),
    create: jest.fn().mockResolvedValue({}),
  };
  const lookup: jest.Mocked<NavigationLookupPort> = {
    exists: jest
      .fn()
      .mockImplementation((_type, target) => Promise.resolve(existingTargets.includes(target))),
    resolvePath: jest.fn(),
  };
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  return {
    useCase: new CreateMenuUseCase(menus, versions, lookup, auditLog),
    menus,
    versions,
    lookup,
    auditLog,
  };
}

const BASE_ITEM: NavigationItemInput = {
  tempId: 'a',
  parentTempId: null,
  label: 'Home',
  type: NavigationItemType.LINK,
  target: '/',
  sortOrder: 0,
};

describe('CreateMenuUseCase', () => {
  it('creates the menu, records version #1, and audits the creation', async () => {
    const { useCase, menus, versions, auditLog } = buildUseCase();

    const menu = await useCase.execute({
      name: 'Header',
      location: 'header',
      items: [BASE_ITEM],
      actorUserId: 'admin-1',
      ipAddress: null,
    });

    expect(menus.create).toHaveBeenCalled();
    expect(versions.create).toHaveBeenCalledWith(expect.objectContaining({ menuId: menu.id }));
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'navigation.menu.created' }),
    );
  });

  it('throws NavigationTargetNotFoundError when a dynamic item references a missing resource', async () => {
    const { useCase } = buildUseCase([]);

    await expect(
      useCase.execute({
        name: 'Header',
        location: 'header',
        items: [{ ...BASE_ITEM, type: NavigationItemType.CATEGORY, target: 'missing-cat' }],
        actorUserId: 'admin-1',
        ipAddress: null,
      }),
    ).rejects.toThrow(NavigationTargetNotFoundError);
  });

  it('throws NavigationDepthExceededError when the tree is too deep', async () => {
    const { useCase } = buildUseCase();

    await expect(
      useCase.execute({
        name: 'Header',
        location: 'header',
        items: [
          { ...BASE_ITEM, tempId: 'a', parentTempId: null },
          { ...BASE_ITEM, tempId: 'b', parentTempId: 'a' },
          { ...BASE_ITEM, tempId: 'c', parentTempId: 'b' },
          { ...BASE_ITEM, tempId: 'd', parentTempId: 'c' },
        ],
        actorUserId: 'admin-1',
        ipAddress: null,
      }),
    ).rejects.toThrow(NavigationDepthExceededError);
  });
});
