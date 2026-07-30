import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { ADDRESS_REPOSITORY } from '../../customer.constants';
import type { AddressEntity } from '../../domain/entities/address.entity';
import { AddressNotFoundError } from '../../domain/errors/customer.errors';
import type {
  AddressRepositoryPort,
  UpdateAddressData,
} from '../../domain/ports/address.repository.port';

export interface UpdateAddressInput extends UpdateAddressData {
  id: string;
  customerId: string;
}

@Injectable()
export class UpdateAddressUseCase {
  constructor(
    @Inject(ADDRESS_REPOSITORY) private readonly addresses: AddressRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: UpdateAddressInput): Promise<AddressEntity> {
    const existing = await this.addresses.findById(input.id);
    // 404 en vez de 403 ante una dirección ajena — no revela que el recurso existe (spec §10 "autorización por propietario").
    if (!existing || existing.customerId !== input.customerId) {
      throw new AddressNotFoundError();
    }

    if (input.isDefault) {
      const type = input.type ?? existing.type;
      const previousDefault = await this.addresses.findDefaultByType(input.customerId, type);
      if (previousDefault && previousDefault.id !== input.id) {
        await this.addresses.unsetDefault(previousDefault.id);
      }
    }

    const { id, customerId, ...data } = input;
    const updated = await this.addresses.update(id, data);

    await this.auditLog.record({
      userId: customerId,
      action: 'customer.address_updated',
      ipAddress: null,
      metadata: { addressId: id },
    });

    return updated;
  }
}
