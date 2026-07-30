import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { SHIPPING_METHOD_REPOSITORY } from '../../checkout.constants';
import type { ShippingMethodEntity } from '../../domain/entities/shipping-method.entity';
import type {
  CreateShippingMethodData,
  ShippingMethodRepositoryPort,
} from '../../domain/ports/shipping-method.repository.port';

export interface CreateShippingMethodInput extends CreateShippingMethodData {
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class CreateShippingMethodUseCase {
  constructor(
    @Inject(SHIPPING_METHOD_REPOSITORY)
    private readonly shippingMethods: ShippingMethodRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: CreateShippingMethodInput): Promise<ShippingMethodEntity> {
    const created = await this.shippingMethods.create({
      name: input.name,
      basePrice: input.basePrice,
      estimatedDaysMin: input.estimatedDaysMin,
      estimatedDaysMax: input.estimatedDaysMax,
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    });

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'checkout.shipping_method.created',
      ipAddress: input.ipAddress,
      metadata: { shippingMethodId: created.id, name: created.toJSON().name },
    });

    return created;
  }
}
