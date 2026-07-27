import { slugify } from '@mijersey/shared-utils';
import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { ATTRIBUTE_REPOSITORY } from '../../attributes.constants';
import type { AttributeEntity } from '../../domain/entities/attribute.entity';
import {
  AttributeCodeAlreadyExistsError,
  DuplicateAttributeValueError,
} from '../../domain/errors/attribute.errors';
import type { AttributeRepositoryPort } from '../../domain/ports/attribute.repository.port';
import { AttributeCode } from '../../domain/value-objects/attribute-code.vo';
import type { AttributeType } from '../../domain/value-objects/attribute-enums';
import { AttributeCacheService } from '../services/attribute-cache.service';

export interface CreateAttributeValueInput {
  value: string;
  label: string;
}

export interface CreateAttributeInput {
  code?: string;
  name: string;
  type: AttributeType;
  isFilterable?: boolean;
  isComparable?: boolean;
  isRequired?: boolean;
  values?: CreateAttributeValueInput[];
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class CreateAttributeUseCase {
  constructor(
    @Inject(ATTRIBUTE_REPOSITORY) private readonly attributes: AttributeRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
    private readonly cache: AttributeCacheService,
  ) {}

  async execute(input: CreateAttributeInput): Promise<AttributeEntity> {
    const code = AttributeCode.create(
      input.code?.trim() ? input.code : slugify(input.name).replace(/-/g, '_'),
    ).toString();

    if (await this.attributes.existsByCode(code)) {
      throw new AttributeCodeAlreadyExistsError();
    }

    const values = (input.values ?? []).map((value) => ({
      value: value.value.trim(),
      label: value.label.trim(),
    }));
    const uniqueValues = new Set(values.map((value) => value.value));
    if (uniqueValues.size !== values.length) {
      throw new DuplicateAttributeValueError();
    }

    const attribute = await this.attributes.create({
      code,
      name: input.name.trim(),
      type: input.type,
      isFilterable: input.isFilterable ?? false,
      isComparable: input.isComparable ?? false,
      isRequired: input.isRequired ?? false,
      values,
    });

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'attributes.attribute.created',
      ipAddress: input.ipAddress,
      metadata: { attributeId: attribute.id, code },
    });

    if (attribute.isFilterable) {
      await this.cache.invalidateDefaultFacets();
    }

    return attribute;
  }
}
