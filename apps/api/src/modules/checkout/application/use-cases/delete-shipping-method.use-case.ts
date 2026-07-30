import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { SHIPPING_METHOD_REPOSITORY } from '../../checkout.constants';
import { ShippingMethodNotFoundError } from '../../domain/errors/checkout.errors';
import type { ShippingMethodRepositoryPort } from '../../domain/ports/shipping-method.repository.port';

export interface DeleteShippingMethodInput {
  id: string;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class DeleteShippingMethodUseCase {
  constructor(
    @Inject(SHIPPING_METHOD_REPOSITORY)
    private readonly shippingMethods: ShippingMethodRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: DeleteShippingMethodInput): Promise<void> {
    const existing = await this.shippingMethods.findById(input.id);
    if (!existing) throw new ShippingMethodNotFoundError();

    await this.shippingMethods.delete(input.id);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'checkout.shipping_method.deleted',
      ipAddress: input.ipAddress,
      metadata: { shippingMethodId: input.id },
    });
  }
}
