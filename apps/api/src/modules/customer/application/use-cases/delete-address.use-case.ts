import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { ADDRESS_REPOSITORY } from '../../customer.constants';
import { AddressNotFoundError } from '../../domain/errors/customer.errors';
import type { AddressRepositoryPort } from '../../domain/ports/address.repository.port';

export interface DeleteAddressInput {
  id: string;
  customerId: string;
}

@Injectable()
export class DeleteAddressUseCase {
  constructor(
    @Inject(ADDRESS_REPOSITORY) private readonly addresses: AddressRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: DeleteAddressInput): Promise<void> {
    const existing = await this.addresses.findById(input.id);
    if (!existing || existing.customerId !== input.customerId) {
      throw new AddressNotFoundError();
    }

    await this.addresses.delete(input.id);

    await this.auditLog.record({
      userId: input.customerId,
      action: 'customer.address_deleted',
      ipAddress: null,
      metadata: { addressId: input.id },
    });
  }
}
