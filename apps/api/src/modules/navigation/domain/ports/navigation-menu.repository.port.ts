import type { PaginatedResult, PaginationParams } from '@mijersey/shared-types';

import type { NavigationMenuEntity } from '../entities/navigation-menu.entity';
import type { NavigationItemType, NavigationMenuStatus } from '../value-objects/navigation-enums';
import type { VisibilityRules } from '../value-objects/visibility-rules.util';

export interface NavigationItemInput {
  /** Id asignado por el cliente, único dentro de la solicitud — permite expresar jerarquía (`parentTempId`) antes de que existan ids reales. */
  tempId: string;
  parentTempId: string | null;
  label: string;
  type: NavigationItemType;
  target: string;
  icon?: string | null;
  sortOrder: number;
  visibilityRules?: VisibilityRules | null;
  openInNewTab?: boolean;
}

export interface CreateMenuData {
  name: string;
  location: string;
  items: NavigationItemInput[];
}

export interface UpdateMenuData {
  name?: string;
  location?: string;
  status?: NavigationMenuStatus;
  items?: NavigationItemInput[];
}

export interface ListMenusParams extends PaginationParams {
  location?: string;
  status?: NavigationMenuStatus;
}

export interface NavigationMenuRepositoryPort {
  findById(id: string): Promise<NavigationMenuEntity | null>;
  findMany(params: ListMenusParams): Promise<PaginatedResult<NavigationMenuEntity>>;
  /** El más recientemente actualizado entre los `PUBLISHED` de esa `location` — criterio determinista para cuando existan varios activos por segmentación (spec §4). */
  findPublishedByLocation(location: string): Promise<NavigationMenuEntity | null>;
  create(data: CreateMenuData): Promise<NavigationMenuEntity>;
  update(id: string, data: UpdateMenuData): Promise<NavigationMenuEntity>;
  delete(id: string): Promise<void>;
}
