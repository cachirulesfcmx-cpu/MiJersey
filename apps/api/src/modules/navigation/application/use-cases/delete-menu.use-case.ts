import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { NavigationMenuNotFoundError } from '../../domain/errors/navigation.errors';
import type { NavigationMenuRepositoryPort } from '../../domain/ports/navigation-menu.repository.port';
import { NAVIGATION_MENU_REPOSITORY } from '../../navigation.constants';
import { NavigationCacheService } from '../services/navigation-cache.service';

export interface DeleteMenuInput {
  id: string;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class DeleteMenuUseCase {
  constructor(
    @Inject(NAVIGATION_MENU_REPOSITORY) private readonly menus: NavigationMenuRepositoryPort,
    private readonly cache: NavigationCacheService,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: DeleteMenuInput): Promise<void> {
    const existing = await this.menus.findById(input.id);
    if (!existing) throw new NavigationMenuNotFoundError();

    await this.menus.delete(input.id);
    await this.cache.invalidateLocation(existing.location);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'navigation.menu.deleted',
      ipAddress: input.ipAddress,
      metadata: { menuId: input.id, location: existing.location },
    });
  }
}
