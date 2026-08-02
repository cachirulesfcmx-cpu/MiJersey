import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import type { NavigationMenuEntity } from '../../domain/entities/navigation-menu.entity';
import type { NavigationLookupPort } from '../../domain/ports/navigation-lookup.port';
import type {
  CreateMenuData,
  NavigationMenuRepositoryPort,
} from '../../domain/ports/navigation-menu.repository.port';
import type { NavigationVersionRepositoryPort } from '../../domain/ports/navigation-version.repository.port';
import { toNavigationSnapshot } from '../../domain/value-objects/navigation-snapshot.util';
import {
  NAVIGATION_LOOKUP,
  NAVIGATION_MENU_REPOSITORY,
  NAVIGATION_VERSION_REPOSITORY,
} from '../../navigation.constants';
import { assertItemsValid } from '../services/assert-items-valid';

export interface CreateMenuInput extends CreateMenuData {
  actorUserId: string;
  ipAddress: string | null;
}

/** Cada creación deja la versión #1 en el historial (spec §10) — mismo criterio que CMS Pages (026) y Blog (027). */
@Injectable()
export class CreateMenuUseCase {
  constructor(
    @Inject(NAVIGATION_MENU_REPOSITORY) private readonly menus: NavigationMenuRepositoryPort,
    @Inject(NAVIGATION_VERSION_REPOSITORY)
    private readonly versions: NavigationVersionRepositoryPort,
    @Inject(NAVIGATION_LOOKUP) private readonly lookup: NavigationLookupPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: CreateMenuInput): Promise<NavigationMenuEntity> {
    await assertItemsValid(input.items, this.lookup);

    const { actorUserId, ipAddress, ...data } = input;
    const menu = await this.menus.create(data);

    await this.versions.create({ menuId: menu.id, snapshot: toNavigationSnapshot(menu) });

    await this.auditLog.record({
      userId: actorUserId,
      action: 'navigation.menu.created',
      ipAddress,
      metadata: { menuId: menu.id, location: menu.location },
    });

    return menu;
  }
}
