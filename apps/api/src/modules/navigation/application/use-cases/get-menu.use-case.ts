import { Inject, Injectable } from '@nestjs/common';

import type { NavigationMenuEntity } from '../../domain/entities/navigation-menu.entity';
import { NavigationMenuNotFoundError } from '../../domain/errors/navigation.errors';
import type { NavigationMenuRepositoryPort } from '../../domain/ports/navigation-menu.repository.port';
import { NAVIGATION_MENU_REPOSITORY } from '../../navigation.constants';

@Injectable()
export class GetMenuUseCase {
  constructor(
    @Inject(NAVIGATION_MENU_REPOSITORY) private readonly menus: NavigationMenuRepositoryPort,
  ) {}

  async execute(id: string): Promise<NavigationMenuEntity> {
    const menu = await this.menus.findById(id);
    if (!menu) throw new NavigationMenuNotFoundError();
    return menu;
  }
}
