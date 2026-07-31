import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { WishlistItemNotFoundError } from '../../domain/errors/wishlist.errors';
import type { WishlistItemRepositoryPort } from '../../domain/ports/wishlist-item.repository.port';
import { WISHLIST_ITEM_REPOSITORY } from '../../wishlist.constants';

export interface RemoveWishlistItemInput {
  wishlistId: string;
  itemId: string;
  customerId: string;
}

@Injectable()
export class RemoveWishlistItemUseCase {
  constructor(
    @Inject(WISHLIST_ITEM_REPOSITORY) private readonly items: WishlistItemRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: RemoveWishlistItemInput): Promise<void> {
    const existing = await this.items.findById(input.itemId);
    // 404 en vez de 403 ante un item de otra lista — no revela que el recurso existe.
    if (!existing || existing.wishlistId !== input.wishlistId) {
      throw new WishlistItemNotFoundError();
    }

    await this.items.delete(input.itemId);

    await this.auditLog.record({
      userId: input.customerId,
      action: 'wishlist.item_removed',
      ipAddress: null,
      metadata: { wishlistId: input.wishlistId, itemId: input.itemId },
    });
  }
}
