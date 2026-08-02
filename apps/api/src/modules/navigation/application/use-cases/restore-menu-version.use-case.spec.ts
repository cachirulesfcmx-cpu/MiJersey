import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { NavigationMenuEntity } from '../../domain/entities/navigation-menu.entity';
import { NavigationVersionEntity } from '../../domain/entities/navigation-version.entity';
import {
  NavigationMenuNotFoundError,
  NavigationVersionNotFoundError,
} from '../../domain/errors/navigation.errors';
import type { NavigationMenuRepositoryPort } from '../../domain/ports/navigation-menu.repository.port';
import type { NavigationVersionRepositoryPort } from '../../domain/ports/navigation-version.repository.port';
import { NavigationMenuStatus } from '../../domain/value-objects/navigation-enums';
import type { NavigationCacheService } from '../services/navigation-cache.service';
import { RestoreMenuVersionUseCase } from './restore-menu-version.use-case';

function buildMenu(
  overrides: Partial<{ name: string; location: string }> = {},
): NavigationMenuEntity {
  return new NavigationMenuEntity({
    id: 'menu-1',
    name: overrides.name ?? 'Header (actual)',
    location: overrides.location ?? 'header',
    status: NavigationMenuStatus.PUBLISHED,
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildVersion(): NavigationVersionEntity {
  return new NavigationVersionEntity({
    id: 'version-1',
    menuId: 'menu-1',
    versionNumber: 1,
    snapshot: {
      name: 'Header (viejo)',
      location: 'header',
      status: NavigationMenuStatus.DRAFT,
      items: [],
    },
    createdAt: new Date(),
  });
}

function buildUseCase(
  options: { menu?: NavigationMenuEntity | null; version?: NavigationVersionEntity | null } = {},
) {
  const menus: jest.Mocked<NavigationMenuRepositoryPort> = {
    findById: jest.fn().mockResolvedValue(options.menu === undefined ? buildMenu() : options.menu),
    findMany: jest.fn(),
    findPublishedByLocation: jest.fn(),
    create: jest.fn(),
    update: jest
      .fn()
      .mockImplementation((_id, data) =>
        Promise.resolve(buildMenu({ name: data.name, location: data.location })),
      ),
    delete: jest.fn(),
  };
  const versions: jest.Mocked<NavigationVersionRepositoryPort> = {
    findByMenuAndNumber: jest
      .fn()
      .mockResolvedValue(options.version === undefined ? buildVersion() : options.version),
    findMany: jest.fn(),
    getNextVersionNumber: jest.fn().mockResolvedValue(2),
    create: jest.fn().mockResolvedValue({}),
  };
  const cache = {
    getRenderedMenu: jest.fn(),
    setRenderedMenu: jest.fn(),
    invalidateLocation: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<NavigationCacheService>;
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  return {
    useCase: new RestoreMenuVersionUseCase(menus, versions, cache, auditLog),
    menus,
    versions,
    cache,
    auditLog,
  };
}

describe('RestoreMenuVersionUseCase', () => {
  it('throws NavigationMenuNotFoundError when the menu does not exist', async () => {
    const { useCase } = buildUseCase({ menu: null });

    await expect(
      useCase.execute({
        menuId: 'menu-1',
        versionNumber: 1,
        actorUserId: 'admin-1',
        ipAddress: null,
      }),
    ).rejects.toThrow(NavigationMenuNotFoundError);
  });

  it('throws NavigationVersionNotFoundError when the version does not exist', async () => {
    const { useCase } = buildUseCase({ version: null });

    await expect(
      useCase.execute({
        menuId: 'menu-1',
        versionNumber: 99,
        actorUserId: 'admin-1',
        ipAddress: null,
      }),
    ).rejects.toThrow(NavigationVersionNotFoundError);
  });

  it('applies the snapshot via update and creates a new version', async () => {
    const { useCase, menus, versions } = buildUseCase();

    await useCase.execute({
      menuId: 'menu-1',
      versionNumber: 1,
      actorUserId: 'admin-1',
      ipAddress: null,
    });

    expect(menus.update).toHaveBeenCalledWith(
      'menu-1',
      expect.objectContaining({ name: 'Header (viejo)' }),
    );
    expect(versions.create).toHaveBeenCalled();
  });

  it('invalidates the cache for the affected location and records an audit entry', async () => {
    const { useCase, cache, auditLog } = buildUseCase();

    await useCase.execute({
      menuId: 'menu-1',
      versionNumber: 1,
      actorUserId: 'admin-1',
      ipAddress: null,
    });

    expect(cache.invalidateLocation).toHaveBeenCalledWith('header');
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'navigation.menu.version_restored',
        metadata: expect.objectContaining({ restoredFrom: 1 }),
      }),
    );
  });
});
