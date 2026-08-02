import type { NavigationMenuEntity } from '../entities/navigation-menu.entity';
import type { NavigationSnapshot } from '../entities/navigation-version.entity';

/** Convierte el estado actual de un menú en el JSON completo que respalda un `NavigationVersion` — usa el id real de cada ítem como `tempId`, ya persistido, para poder recrearlos igual al restaurar. */
export function toNavigationSnapshot(menu: NavigationMenuEntity): NavigationSnapshot {
  const json = menu.toJSON();
  return {
    name: json.name,
    location: json.location,
    status: json.status,
    items: json.items.map((item) => ({
      tempId: item.id,
      parentTempId: item.parentId,
      label: item.label,
      type: item.type,
      target: item.target,
      icon: item.icon,
      sortOrder: item.sortOrder,
      visibilityRules: item.visibilityRules,
      openInNewTab: item.openInNewTab,
    })),
  };
}
