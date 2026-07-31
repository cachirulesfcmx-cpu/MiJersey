import { randomUUID } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import type { WishlistEntity } from '../../domain/entities/wishlist.entity';
import type { WishlistRepositoryPort } from '../../domain/ports/wishlist.repository.port';
import { WISHLIST_REPOSITORY } from '../../wishlist.constants';

export interface ShareWishlistInput {
  wishlistId: string;
  customerId: string;
}

/** Genera el token de enlace compartido si todavía no existe — reutiliza el mismo token en llamadas subsecuentes (compartir dos veces no invalida el enlace ya distribuido). Validado en `GetSharedWishlistUseCase` (spec §9 "validación de enlaces compartidos"): un token inexistente es simplemente un 404, sin información adicional. */
@Injectable()
export class ShareWishlistUseCase {
  constructor(
    @Inject(WISHLIST_REPOSITORY) private readonly wishlists: WishlistRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: ShareWishlistInput): Promise<WishlistEntity> {
    const existing = await this.wishlists.findById(input.wishlistId);
    if (existing?.shareToken) return existing;

    const updated = await this.wishlists.setShareToken(input.wishlistId, randomUUID());

    await this.auditLog.record({
      userId: input.customerId,
      action: 'wishlist.shared',
      ipAddress: null,
      metadata: { wishlistId: input.wishlistId },
    });

    return updated;
  }
}
