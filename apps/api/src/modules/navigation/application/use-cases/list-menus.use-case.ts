import type { PaginatedResult } from '@mijersey/shared-types';
import { Inject, Injectable } from '@nestjs/common';

import type { NavigationMenuEntity } from '../../domain/entities/navigation-menu.entity';
import type {
  ListMenusParams,
  NavigationMenuRepositoryPort,
} from '../../domain/ports/navigation-menu.repository.port';
import { NAVIGATION_MENU_REPOSITORY } from '../../navigation.constants';

@Injectable()
export class ListMenusUseCase {
  constructor(
    @Inject(NAVIGATION_MENU_REPOSITORY) private readonly menus: NavigationMenuRepositoryPort,
  ) {}

  async execute(params: ListMenusParams): Promise<PaginatedResult<NavigationMenuEntity>> {
    return this.menus.findMany(params);
  }
}
