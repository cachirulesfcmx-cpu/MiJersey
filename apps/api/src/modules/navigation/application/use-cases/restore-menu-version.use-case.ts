import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import type { NavigationMenuEntity } from '../../domain/entities/navigation-menu.entity';
import {
  NavigationMenuNotFoundError,
  NavigationVersionNotFoundError,
} from '../../domain/errors/navigation.errors';
import type { NavigationMenuRepositoryPort } from '../../domain/ports/navigation-menu.repository.port';
import type { NavigationVersionRepositoryPort } from '../../domain/ports/navigation-version.repository.port';
import { toNavigationSnapshot } from '../../domain/value-objects/navigation-snapshot.util';
import {
  NAVIGATION_MENU_REPOSITORY,
  NAVIGATION_VERSION_REPOSITORY,
} from '../../navigation.constants';
import { NavigationCacheService } from '../services/navigation-cache.service';

export interface RestoreMenuVersionInput {
  menuId: string;
  versionNumber: number;
  actorUserId: string;
  ipAddress: string | null;
}

/** Restaurar no borra historial: aplica el snapshot elegido y guarda el resultado como una versión NUEVA, sin tocar el `status` vigente del menú — mismo criterio que CMS Pages (026) y Blog (027). */
@Injectable()
export class RestoreMenuVersionUseCase {
  constructor(
    @Inject(NAVIGATION_MENU_REPOSITORY) private readonly menus: NavigationMenuRepositoryPort,
    @Inject(NAVIGATION_VERSION_REPOSITORY)
    private readonly versions: NavigationVersionRepositoryPort,
    private readonly cache: NavigationCacheService,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: RestoreMenuVersionInput): Promise<NavigationMenuEntity> {
    const existing = await this.menus.findById(input.menuId);
    if (!existing) throw new NavigationMenuNotFoundError();

    const version = await this.versions.findByMenuAndNumber(input.menuId, input.versionNumber);
    if (!version) throw new NavigationVersionNotFoundError();

    const { snapshot } = version;
    const restored = await this.menus.update(input.menuId, {
      name: snapshot.name,
      location: snapshot.location,
      items: snapshot.items,
    });

    await this.versions.create({ menuId: restored.id, snapshot: toNavigationSnapshot(restored) });

    await this.cache.invalidateLocation(existing.location);
    if (restored.location !== existing.location)
      await this.cache.invalidateLocation(restored.location);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'navigation.menu.version_restored',
      ipAddress: input.ipAddress,
      metadata: { menuId: input.menuId, restoredFrom: input.versionNumber },
    });

    return restored;
  }
}
