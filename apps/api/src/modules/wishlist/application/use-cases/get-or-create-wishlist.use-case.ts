import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import type { WishlistEntity } from '../../domain/entities/wishlist.entity';
import type { WishlistRepositoryPort } from '../../domain/ports/wishlist.repository.port';
import { WISHLIST_REPOSITORY } from '../../wishlist.constants';

/** "Cada cliente tendrá al menos una Wishlist predeterminada" (spec §4) — se crea de forma perezosa en el primer acceso, igual que `CustomerProfile` en 019. */
@Injectable()
export class GetOrCreateWishlistUseCase {
  constructor(
    @Inject(WISHLIST_REPOSITORY) private readonly wishlists: WishlistRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(customerId: string): Promise<WishlistEntity> {
    const existing = await this.wishlists.findDefaultByCustomerId(customerId);
    if (existing) return existing;

    const created = await this.wishlists.create({ customerId });

    await this.auditLog.record({
      userId: customerId,
      action: 'wishlist.created',
      ipAddress: null,
      metadata: { wishlistId: created.id },
    });

    return created;
  }
}
