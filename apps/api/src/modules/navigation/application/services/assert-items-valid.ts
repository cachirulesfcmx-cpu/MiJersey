import { NavigationTargetNotFoundError } from '../../domain/errors/navigation.errors';
import type { NavigationLookupPort } from '../../domain/ports/navigation-lookup.port';
import type { NavigationItemInput } from '../../domain/ports/navigation-menu.repository.port';
import { NavigationItemType } from '../../domain/value-objects/navigation-enums';
import { assertValidTreeDepth } from '../../domain/value-objects/navigation-tree.util';
import { MAX_NAVIGATION_DEPTH } from '../../navigation.constants';

/** Valida profundidad (spec §4) y, para tipos dinámicos, que el recurso enlazado exista (spec §4 "validar referencias a recursos internos") antes de escribir. */
export async function assertItemsValid(
  items: NavigationItemInput[],
  lookup: NavigationLookupPort,
): Promise<void> {
  assertValidTreeDepth(
    items.map((item) => ({ id: item.tempId, parentId: item.parentTempId })),
    MAX_NAVIGATION_DEPTH,
  );

  for (const item of items) {
    if (item.type === NavigationItemType.LINK) continue;
    const found = await lookup.exists(item.type, item.target);
    if (!found) throw new NavigationTargetNotFoundError(item.label);
  }
}
