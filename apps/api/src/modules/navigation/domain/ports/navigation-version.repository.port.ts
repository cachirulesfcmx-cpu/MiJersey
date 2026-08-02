import type { PaginatedResult, PaginationParams } from '@mijersey/shared-types';

import type {
  NavigationSnapshot,
  NavigationVersionEntity,
} from '../entities/navigation-version.entity';

export interface CreateNavigationVersionData {
  menuId: string;
  snapshot: NavigationSnapshot;
}

export interface NavigationVersionRepositoryPort {
  findByMenuAndNumber(
    menuId: string,
    versionNumber: number,
  ): Promise<NavigationVersionEntity | null>;
  findMany(
    menuId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<NavigationVersionEntity>>;
  getNextVersionNumber(menuId: string): Promise<number>;
  create(data: CreateNavigationVersionData): Promise<NavigationVersionEntity>;
}
