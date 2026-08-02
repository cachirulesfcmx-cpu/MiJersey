import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import type { NavigationMenuEntity } from '../../domain/entities/navigation-menu.entity';
import { NavigationMenuNotFoundError } from '../../domain/errors/navigation.errors';
import type { NavigationLookupPort } from '../../domain/ports/navigation-lookup.port';
import type {
  NavigationMenuRepositoryPort,
  UpdateMenuData,
} from '../../domain/ports/navigation-menu.repository.port';
import type { NavigationVersionRepositoryPort } from '../../domain/ports/navigation-version.repository.port';
import { toNavigationSnapshot } from '../../domain/value-objects/navigation-snapshot.util';
import {
  NAVIGATION_LOOKUP,
  NAVIGATION_MENU_REPOSITORY,
  NAVIGATION_VERSION_REPOSITORY,
} from '../../navigation.constants';
import { assertItemsValid } from '../services/assert-items-valid';
import { NavigationCacheService } from '../services/navigation-cache.service';

export interface UpdateMenuInput extends UpdateMenuData {
  id: string;
  actorUserId: string;
  ipAddress: string | null;
}

/** Cada actualización crea una nueva versión (spec §10 "cambios de estructura") e invalida la caché de la ubicación afectada (la anterior y, si cambió, la nueva) — el estado del menú (`status`) puede cambiar en el mismo PATCH, a diferencia de CMS Pages/Blog, que tienen un endpoint de publicación separado. */
@Injectable()
export class UpdateMenuUseCase {
  constructor(
    @Inject(NAVIGATION_MENU_REPOSITORY) private readonly menus: NavigationMenuRepositoryPort,
    @Inject(NAVIGATION_VERSION_REPOSITORY)
    private readonly versions: NavigationVersionRepositoryPort,
    @Inject(NAVIGATION_LOOKUP) private readonly lookup: NavigationLookupPort,
    private readonly cache: NavigationCacheService,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: UpdateMenuInput): Promise<NavigationMenuEntity> {
    const existing = await this.menus.findById(input.id);
    if (!existing) throw new NavigationMenuNotFoundError();

    if (input.items) await assertItemsValid(input.items, this.lookup);

    const { id, actorUserId, ipAddress, ...data } = input;
    const updated = await this.menus.update(id, data);

    await this.versions.create({ menuId: updated.id, snapshot: toNavigationSnapshot(updated) });

    await this.cache.invalidateLocation(existing.location);
    if (updated.location !== existing.location)
      await this.cache.invalidateLocation(updated.location);

    await this.auditLog.record({
      userId: actorUserId,
      action: 'navigation.menu.updated',
      ipAddress,
      metadata: { menuId: updated.id, location: updated.location },
    });

    return updated;
  }
}
