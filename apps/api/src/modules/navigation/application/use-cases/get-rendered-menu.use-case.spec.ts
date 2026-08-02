import { NavigationItemEntity } from '../../domain/entities/navigation-item.entity';
import { NavigationMenuEntity } from '../../domain/entities/navigation-menu.entity';
import type { NavigationLookupPort } from '../../domain/ports/navigation-lookup.port';
import type { NavigationMenuRepositoryPort } from '../../domain/ports/navigation-menu.repository.port';
import {
  NavigationItemType,
  NavigationMenuStatus,
} from '../../domain/value-objects/navigation-enums';
import type { NavigationCacheService } from '../services/navigation-cache.service';
import { GetRenderedMenuUseCase } from './get-rendered-menu.use-case';

function buildItem(
  overrides: Partial<{
    id: string;
    parentId: string | null;
    type: NavigationItemType;
    target: string;
  }>,
): NavigationItemEntity {
  return new NavigationItemEntity({
    id: overrides.id ?? 'item-1',
    menuId: 'menu-1',
    parentId: overrides.parentId ?? null,
    label: overrides.id ?? 'item-1',
    type: overrides.type ?? NavigationItemType.LINK,
    target: overrides.target ?? '/custom',
    icon: null,
    sortOrder: 0,
    visibilityRules: null,
    openInNewTab: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildMenu(items: NavigationItemEntity[]): NavigationMenuEntity {
  return new NavigationMenuEntity({
    id: 'menu-1',
    name: 'Header',
    location: 'header',
    status: NavigationMenuStatus.PUBLISHED,
    items,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildUseCase(menu: NavigationMenuEntity | null) {
  const menus: jest.Mocked<NavigationMenuRepositoryPort> = {
    findById: jest.fn(),
    findMany: jest.fn(),
    findPublishedByLocation: jest.fn().mockResolvedValue(menu),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const lookup: jest.Mocked<NavigationLookupPort> = {
    exists: jest.fn(),
    resolvePath: jest.fn(),
  };
  const cache = {
    getRenderedMenu: jest.fn().mockResolvedValue(null),
    setRenderedMenu: jest.fn().mockResolvedValue(undefined),
    invalidateLocation: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<NavigationCacheService>;

  return { useCase: new GetRenderedMenuUseCase(menus, lookup, cache), menus, lookup, cache };
}

const NO_CONTEXT = { authenticated: false, device: null };

describe('GetRenderedMenuUseCase', () => {
  it('returns an empty tree when there is no published menu for the location', async () => {
    const { useCase, cache } = buildUseCase(null);

    const result = await useCase.execute('footer', NO_CONTEXT);

    expect(result).toEqual([]);
    expect(cache.setRenderedMenu).toHaveBeenCalledWith('footer', '[]');
  });

  it('resolves LINK targets directly and dynamic targets via the lookup port', async () => {
    const menu = buildMenu([
      buildItem({ id: 'link', type: NavigationItemType.LINK, target: '/about' }),
      buildItem({ id: 'cat', type: NavigationItemType.CATEGORY, target: 'cat-1' }),
    ]);
    const { useCase, lookup } = buildUseCase(menu);
    (lookup.resolvePath as jest.Mock).mockResolvedValue('/categories/jerseys');

    const result = await useCase.execute('header', NO_CONTEXT);

    expect(lookup.resolvePath).toHaveBeenCalledWith(NavigationItemType.CATEGORY, 'cat-1');
    expect(result.map((item) => item.href)).toEqual(['/about', '/categories/jerseys']);
  });

  it('drops items whose linked resource no longer exists', async () => {
    const menu = buildMenu([
      buildItem({ id: 'cat', type: NavigationItemType.CATEGORY, target: 'missing' }),
    ]);
    const { useCase, lookup } = buildUseCase(menu);
    (lookup.resolvePath as jest.Mock).mockResolvedValue(null);

    const result = await useCase.execute('header', NO_CONTEXT);

    expect(result).toEqual([]);
  });

  it('reads from the cache without hitting the repository again', async () => {
    const { useCase, menus, cache } = buildUseCase(null);
    (cache.getRenderedMenu as jest.Mock).mockResolvedValue(
      JSON.stringify([
        {
          id: 'a',
          parentId: null,
          label: 'A',
          type: NavigationItemType.LINK,
          href: '/a',
          icon: null,
          sortOrder: 0,
          openInNewTab: false,
          visibilityRules: null,
        },
      ]),
    );

    const result = await useCase.execute('header', NO_CONTEXT);

    expect(menus.findPublishedByLocation).not.toHaveBeenCalled();
    expect(result.map((item) => item.id)).toEqual(['a']);
  });
});
