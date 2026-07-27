import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { ATTRIBUTE_REPOSITORY } from '../../attributes.constants';
import type { AttributeEntity } from '../../domain/entities/attribute.entity';
import {
  AttributeInUseError,
  AttributeNotFoundError,
  AttributeValueInUseError,
  DuplicateAttributeValueError,
} from '../../domain/errors/attribute.errors';
import type { AttributeRepositoryPort } from '../../domain/ports/attribute.repository.port';
import type { AttributeStatus, AttributeType } from '../../domain/value-objects/attribute-enums';
import { AttributeCacheService } from '../services/attribute-cache.service';

export interface UpdateAttributeValueInput {
  value: string;
  label: string;
}

export interface UpdateAttributeInput {
  id: string;
  name?: string;
  type?: AttributeType;
  isFilterable?: boolean;
  isComparable?: boolean;
  isRequired?: boolean;
  status?: AttributeStatus;
  values?: UpdateAttributeValueInput[];
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class UpdateAttributeUseCase {
  constructor(
    @Inject(ATTRIBUTE_REPOSITORY) private readonly attributes: AttributeRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
    private readonly cache: AttributeCacheService,
  ) {}

  async execute(input: UpdateAttributeInput): Promise<AttributeEntity> {
    const existing = await this.attributes.findById(input.id);
    if (!existing) {
      throw new AttributeNotFoundError();
    }

    const typeChanged = input.type !== undefined && input.type !== existing.type;
    if (typeChanged && (await this.attributes.countAssignments(input.id)) > 0) {
      throw new AttributeInUseError();
    }

    await this.attributes.update(input.id, {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.isFilterable !== undefined ? { isFilterable: input.isFilterable } : {}),
      ...(input.isComparable !== undefined ? { isComparable: input.isComparable } : {}),
      ...(input.isRequired !== undefined ? { isRequired: input.isRequired } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    });

    if (input.values !== undefined) {
      const desired = input.values.map((value) => ({
        value: value.value.trim(),
        label: value.label.trim(),
      }));
      const uniqueValues = new Set(desired.map((value) => value.value));
      if (uniqueValues.size !== desired.length) {
        throw new DuplicateAttributeValueError();
      }

      const desiredValues = new Set(desired.map((value) => value.value));
      const removed = existing.values.filter((value) => !desiredValues.has(value.value));

      for (const value of removed) {
        if ((await this.attributes.countValueAssignments(value.id)) > 0) {
          throw new AttributeValueInUseError();
        }
      }

      await this.attributes.replaceValues(input.id, desired);
    }

    if (typeChanged) {
      await this.auditLog.record({
        userId: input.actorUserId,
        action: 'attributes.attribute.type_changed',
        ipAddress: input.ipAddress,
        metadata: { attributeId: input.id, from: existing.type, to: input.type },
      });
    }

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'attributes.attribute.updated',
      ipAddress: input.ipAddress,
      metadata: { attributeId: input.id },
    });

    if (
      typeChanged ||
      input.isFilterable !== undefined ||
      input.status !== undefined ||
      input.values !== undefined
    ) {
      await this.cache.invalidateDefaultFacets();
    }

    return (await this.attributes.findById(input.id)) as AttributeEntity;
  }
}
