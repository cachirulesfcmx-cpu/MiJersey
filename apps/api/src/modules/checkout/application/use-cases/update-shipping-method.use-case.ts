import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { SHIPPING_METHOD_REPOSITORY } from '../../checkout.constants';
import type { ShippingMethodEntity } from '../../domain/entities/shipping-method.entity';
import { ShippingMethodNotFoundError } from '../../domain/errors/checkout.errors';
import type {
  ShippingMethodRepositoryPort,
  UpdateShippingMethodData,
} from '../../domain/ports/shipping-method.repository.port';

export interface UpdateShippingMethodInput extends UpdateShippingMethodData {
  id: string;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class UpdateShippingMethodUseCase {
  constructor(
    @Inject(SHIPPING_METHOD_REPOSITORY)
    private readonly shippingMethods: ShippingMethodRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: UpdateShippingMethodInput): Promise<ShippingMethodEntity> {
    const existing = await this.shippingMethods.findById(input.id);
    if (!existing) throw new ShippingMethodNotFoundError();

    const { id, actorUserId, ipAddress, ...data } = input;
    const updated = await this.shippingMethods.update(id, data);

    await this.auditLog.record({
      userId: actorUserId,
      action: 'checkout.shipping_method.updated',
      ipAddress,
      metadata: { shippingMethodId: id },
    });

    return updated;
  }
}
