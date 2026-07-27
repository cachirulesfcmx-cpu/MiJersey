import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { ATTRIBUTE_REPOSITORY } from '../../attributes.constants';
import { AttributeNotFoundError } from '../../domain/errors/attribute.errors';
import type { AttributeRepositoryPort } from '../../domain/ports/attribute.repository.port';
import { AttributeCacheService } from '../services/attribute-cache.service';

export interface DeleteAttributeInput {
  id: string;
  actorUserId: string;
  ipAddress: string | null;
}

/** Eliminación lógica: el atributo deja de listarse/filtrarse, pero las asignaciones existentes no se tocan. */
@Injectable()
export class DeleteAttributeUseCase {
  constructor(
    @Inject(ATTRIBUTE_REPOSITORY) private readonly attributes: AttributeRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
    private readonly cache: AttributeCacheService,
  ) {}

  async execute(input: DeleteAttributeInput): Promise<void> {
    const existing = await this.attributes.findById(input.id);
    if (!existing) {
      throw new AttributeNotFoundError();
    }

    await this.attributes.softDelete(input.id);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'attributes.attribute.deleted',
      ipAddress: input.ipAddress,
      metadata: { attributeId: input.id },
    });

    if (existing.isFilterable) {
      await this.cache.invalidateDefaultFacets();
    }
  }
}
