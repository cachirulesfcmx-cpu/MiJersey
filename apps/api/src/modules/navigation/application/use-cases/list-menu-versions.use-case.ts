import type { PaginatedResult, PaginationParams } from '@mijersey/shared-types';
import { Inject, Injectable } from '@nestjs/common';

import type { NavigationVersionEntity } from '../../domain/entities/navigation-version.entity';
import { NavigationMenuNotFoundError } from '../../domain/errors/navigation.errors';
import type { NavigationMenuRepositoryPort } from '../../domain/ports/navigation-menu.repository.port';
import type { NavigationVersionRepositoryPort } from '../../domain/ports/navigation-version.repository.port';
import {
  NAVIGATION_MENU_REPOSITORY,
  NAVIGATION_VERSION_REPOSITORY,
} from '../../navigation.constants';

export interface ListMenuVersionsInput extends PaginationParams {
  menuId: string;
}

@Injectable()
export class ListMenuVersionsUseCase {
  constructor(
    @Inject(NAVIGATION_MENU_REPOSITORY) private readonly menus: NavigationMenuRepositoryPort,
    @Inject(NAVIGATION_VERSION_REPOSITORY)
    private readonly versions: NavigationVersionRepositoryPort,
  ) {}

  async execute(input: ListMenuVersionsInput): Promise<PaginatedResult<NavigationVersionEntity>> {
    const menu = await this.menus.findById(input.menuId);
    if (!menu) throw new NavigationMenuNotFoundError();

    return this.versions.findMany(input.menuId, { page: input.page, pageSize: input.pageSize });
  }
}
