import { Inject, Injectable } from '@nestjs/common';

import type { NavigationLookupPort } from '../../domain/ports/navigation-lookup.port';
import type { NavigationMenuRepositoryPort } from '../../domain/ports/navigation-menu.repository.port';
import { NavigationItemType } from '../../domain/value-objects/navigation-enums';
import {
  buildNavigationTree,
  filterVisibleTree,
  type RenderedNavigationItem,
  type ResolvedNavigationNode,
} from '../../domain/value-objects/navigation-render.util';
import type { VisibilityContext } from '../../domain/value-objects/visibility-rules.util';
import { NAVIGATION_LOOKUP, NAVIGATION_MENU_REPOSITORY } from '../../navigation.constants';
import { NavigationCacheService } from '../services/navigation-cache.service';

/** Render público por ubicación (spec §7 "GET /navigation/render/:location", §8 "caché de menús publicados"). Cachea el árbol ya resuelto (rutas de recursos dinámicos calculadas, nodos con recurso eliminado descartados); la visibilidad por contexto se filtra en cada solicitud sobre ese resultado cacheado. */
@Injectable()
export class GetRenderedMenuUseCase {
  constructor(
    @Inject(NAVIGATION_MENU_REPOSITORY) private readonly menus: NavigationMenuRepositoryPort,
    @Inject(NAVIGATION_LOOKUP) private readonly lookup: NavigationLookupPort,
    private readonly cache: NavigationCacheService,
  ) {}

  async execute(location: string, context: VisibilityContext): Promise<RenderedNavigationItem[]> {
    const resolved = await this.getResolvedNodes(location);
    const visible = filterVisibleTree(resolved, context);
    return buildNavigationTree(visible);
  }

  private async getResolvedNodes(location: string): Promise<ResolvedNavigationNode[]> {
    const cached = await this.cache.getRenderedMenu(location);
    if (cached) return JSON.parse(cached) as ResolvedNavigationNode[];

    const menu = await this.menus.findPublishedByLocation(location);
    if (!menu) {
      await this.cache.setRenderedMenu(location, JSON.stringify([]));
      return [];
    }

    const resolvedEntries = await Promise.all(
      menu.items.map(async (item) => {
        const json = item.toJSON();
        const href =
          json.type === NavigationItemType.LINK
            ? json.target
            : await this.lookup.resolvePath(json.type, json.target);
        if (href === null) return null;

        const node: ResolvedNavigationNode = {
          id: json.id,
          parentId: json.parentId,
          label: json.label,
          type: json.type,
          href,
          icon: json.icon,
          sortOrder: json.sortOrder,
          openInNewTab: json.openInNewTab,
          visibilityRules: json.visibilityRules,
        };
        return node;
      }),
    );

    const resolved = resolvedEntries.filter(
      (node): node is ResolvedNavigationNode => node !== null,
    );
    await this.cache.setRenderedMenu(location, JSON.stringify(resolved));
    return resolved;
  }
}
